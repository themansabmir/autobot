import { TRPCError } from "@trpc/server";
import { decrypt } from "@typebot.io/credentials/decrypt";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import prisma from "@typebot.io/prisma";
import { z } from "@typebot.io/zod";
import ky from "ky";
import { authenticatedProcedure } from "@/helpers/server/trpc";
import { ClientToastError } from "@/lib/ClientToastError";
import { parseWhatsAppTemplate } from "@typebot.io/whatsapp/parseWhatsAppTemplate";

const inputSchema = z.object({
  credentialsId: z.string(),
  templateName: z.string().optional(),
});

export const getTemplates = authenticatedProcedure
  .input(inputSchema)
  .query(async ({ input, ctx: { user } }) => {
    console.log('--- WhatsApp Template Fetch Start ---');
    const credentials = await prisma.credentials.findFirst({
      where: {
        id: input.credentialsId,
        workspace: env.ADMIN_EMAIL?.includes(user.email)
          ? undefined
          : { members: { some: { userId: user.id } } },
      },
    });

    if (!credentials) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Credentials not found",
      });
    }

    let accessToken: string | undefined;
    let phoneNumberId: string | undefined;

    console.log('1. Decrypting credentials...');
    try {
      const decryptedData = (await decrypt(
        credentials.data,
        credentials.iv,
      )) as WhatsAppCredentials["data"];
      
      if (decryptedData.provider === "360dialog") return [];

      accessToken = decryptedData.systemUserAccessToken;
      phoneNumberId = decryptedData.phoneNumberId;
    } catch (err: any) {
      console.error('   Decryption FAILED:', err.message);
      if (env.META_SYSTEM_USER_TOKEN) {
          console.log('   Falling back to META_SYSTEM_USER_TOKEN from env');
          accessToken = env.META_SYSTEM_USER_TOKEN;
      } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Fail to decrypt credentials and no fallback token found: ${err.message}`,
          });
      }
    }

    try {
      console.log('3. Configuration:');
      console.log('   Using API URL:', env.WHATSAPP_CLOUD_API_URL);
      console.log('   WABA ID Fallback:', env.WHATSAPP_BUSINESS_ACCOUNT_ID);
      
      let wabaId: string | undefined;

      if (phoneNumberId && accessToken) {
        try {
          const url = `${env.WHATSAPP_CLOUD_API_URL}/v18.0/${phoneNumberId}`;
          console.log('1. Fetching WABA ID from:', url);
          const phoneData = await ky
              .get(
              url,
              {
                  headers: {
                  Authorization: `Bearer ${accessToken}`,
                  },
                  searchParams: {
                      fields: 'whatsapp_business_account'
                  }
              }
              )
              .json<{ whatsapp_business_account: { id: string } }>();
          wabaId = phoneData.whatsapp_business_account?.id;
          console.log('Found WABA ID from API:', wabaId);
        } catch (err: any) {
          console.error('Error fetching WABA ID via phone:', err.message);
        }
      }

      if (!wabaId) {
          wabaId = env.WHATSAPP_BUSINESS_ACCOUNT_ID;
          console.log('Using fallback WABA ID from env:', wabaId);
      }

      if (!wabaId) {
          console.error('CRITICAL: No WABA ID available (API lookup failed and no fallback in env)');
          throw new Error('WABA ID not found and no fallback provided');
      }

      // 2. Get Templates
      const templatesUrl = `${env.WHATSAPP_CLOUD_API_URL}/v18.0/${wabaId}/message_templates`;
      console.log('2. Fetching Templates from:', templatesUrl);
      const templatesData = await ky
        .get(
          templatesUrl,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            searchParams: {
                limit: 100,
                ...(input.templateName ? { name: input.templateName } : {})
            }
          }
        )
        .json<{ data: any[] }>().catch(async (err) => {
            const errorBody = err.response ? await err.response.text() : 'No response body';
            console.error('Error fetching templates:', err.message, 'Body:', errorBody);
            throw err;
        });

      console.log('Fetched raw templates count:', templatesData.data.length);
      if (templatesData.data.length > 0) {
          console.log('First template status:', templatesData.data[0].status);
      }
      
      console.log('--- WhatsApp Template Fetch Success ---');

      // 3. Parse and Return
      return templatesData.data
        .filter((t: any) => t.status === "APPROVED")
        .map((t: any) => parseWhatsAppTemplate(t));
    } catch (err: any) {
        console.error('--- WhatsApp Template Fetch Failed ---');
        console.error('getTemplates error:', err);
        const error = await ClientToastError.fromUnkownError(err);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            cause: err
        });
    }
  });
