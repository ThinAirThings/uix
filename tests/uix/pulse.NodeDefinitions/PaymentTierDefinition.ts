
import { defineNode } from "@thinairthings/uix";
import { z } from "zod";

export const PaymentTierDefinition = defineNode('PaymentTier',z.object({
    tier: z.enum(['Free', 'Basic', 'Premium']),
}))