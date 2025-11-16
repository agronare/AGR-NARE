'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Este import usa automáticamente firestore SERVER-SIDE
import { firestore } from '@/firebase';

const getProductInfo = ai.defineTool(
  {
    name: 'getProductInfo',
    description: 'Obtiene información detallada sobre un producto específico por su nombre.',
    inputSchema: z.object({
      productName: z.string().describe('El nombre del producto a buscar.'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      name: z.string().optional(),
      price: z.number().optional(),
      sku: z.string().optional(),
      stock: z.number().optional(),
      activeIngredient: z.string().optional(),
    }),
  },
  async ({ productName }) => {
    try {
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, where('name', '==', productName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const allProductsSnapshot = await getDocs(productsRef);
        const foundProduct = allProductsSnapshot.docs.find(doc =>
          doc.data().name.toLowerCase().includes(productName.toLowerCase())
        );

        if (foundProduct) {
          const productData = foundProduct.data();
          const inventoryRef = collection(firestore, 'inventory');
          const stockQuery = query(inventoryRef, where('sku', '==', productData.sku));
          const stockSnapshot = await getDocs(stockQuery);
          const stock = stockSnapshot.docs.reduce(
            (acc, doc) => acc + (doc.data().quantity || 0),
            0
          );

          return {
            found: true,
            name: productData.name,
            price: productData.price,
            sku: productData.sku,
            stock,
            activeIngredient: productData.activeIngredient,
          };
        }

        return { found: false };
      }

      const docSnap = querySnapshot.docs[0];
      const productData = docSnap.data();

      const inventoryRef = collection(firestore, 'inventory');
      const stockQuery = query(inventoryRef, where('sku', '==', productData.sku));
      const stockSnapshot = await getDocs(stockQuery);
      const stock = stockSnapshot.docs.reduce(
        (acc, doc) => acc + (doc.data().quantity || 0),
        0
      );

      return {
        found: true,
        name: productData.name,
        price: productData.price,
        sku: productData.sku,
        stock,
        activeIngredient: productData.activeIngredient,
      };
    } catch (error: any) {
      console.error("Error fetching product info:", error);
      return { found: false, name: `Error: ${error.message}` };
    }
  }
);

const businessAssistantFlow = ai.defineFlow(
  {
    name: 'businessAssistantFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      tools: [getProductInfo],
      system: `Eres un asistente virtual agrícola. Responde siempre en español. Si no encuentras datos, dilo.`,
    });

    return llmResponse.text;
  }
);

export async function askBusinessAssistant(question: string): Promise<string> {
  return businessAssistantFlow(question);
}
