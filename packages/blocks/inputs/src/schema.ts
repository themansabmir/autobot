import { z } from "@typebot.io/zod";
import { addressInputSchema } from "./address/schema";
import { cardsBlockSchema } from "./cards/schema";
import { buttonsInputSchemas } from "./choice/schema";
import { ctaUrlInputSchema } from "./ctaUrl/schema";
import { dateInputSchema } from "./date/schema";
import { emailInputSchema } from "./email/schema";
import { fileInputBlockSchemas } from "./file/schema";
import { flowInputSchema } from "./flow/schema";
import { interactiveListInputSchema } from "./interactiveList/schema";
import { locationRequestInputSchema } from "./locationRequest/schema";
import { mediaCarouselBlockSchema } from "./mediaCarousel/schema";
import { numberInputSchema } from "./number/schema";
import { paymentInputSchema } from "./payment/schema";
import { phoneNumberInputBlockSchema } from "./phone/schema";
import { pictureChoiceBlockSchemas } from "./pictureChoice/schema";
import { productCarouselBlockSchema } from "./productCarousel/schema";
import { ratingInputBlockSchema } from "./rating/schema";
import { templateInputSchema } from "./template/schema";
import { textInputSchema } from "./text/schema";
import { timeInputSchema } from "./time/schema";
import { urlInputSchema } from "./url/schema";

const inputBlockSchemas = [
  textInputSchema,
  emailInputSchema,
  numberInputSchema,
  urlInputSchema,
  phoneNumberInputBlockSchema,
  dateInputSchema,
  timeInputSchema,
  paymentInputSchema,
  ratingInputBlockSchema,
  cardsBlockSchema,
  ctaUrlInputSchema,
  locationRequestInputSchema,
  addressInputSchema,
  templateInputSchema,
  flowInputSchema,
  mediaCarouselBlockSchema,
  productCarouselBlockSchema,
  interactiveListInputSchema,
] as const;

export const inputBlockV5Schema = z.discriminatedUnion("type", [
  ...inputBlockSchemas,
  buttonsInputSchemas.v5,
  fileInputBlockSchemas.v5,
  pictureChoiceBlockSchemas.v5,
]);
export type InputBlockV5 = z.infer<typeof inputBlockV5Schema>;

export const inputBlockV6Schema = z.discriminatedUnion("type", [
  ...inputBlockSchemas,
  buttonsInputSchemas.v6,
  fileInputBlockSchemas.v6,
  pictureChoiceBlockSchemas.v6,
]);
export type InputBlockV6 = z.infer<typeof inputBlockV6Schema>;

export type InputBlock = InputBlockV5 | InputBlockV6;
