export const defaultAddressInputOptions = {
  content: "Please provide your address",
  countryCode: "US",
  labels: {
    street: "Street Address",
    city: "City",
    state: "State/Province",
    country: "Country",
    postalCode: "Postal Code",
  },
  required: {
    street: true,
    city: true,
    state: false,
    country: true,
    postalCode: true,
  },
};
