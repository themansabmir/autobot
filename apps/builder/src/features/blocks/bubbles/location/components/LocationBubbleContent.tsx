import type { LocationBubbleBlock } from "@typebot.io/blocks-bubbles/location/schema";

type Props = {
  block: LocationBubbleBlock;
};

export const LocationBubbleContent = ({ block }: Props) => {
  const { latitude, longitude, name, address } = block.content ?? {};

  if (!latitude && !longitude && !name && !address) {
    return <div className="text-gray-500 italic">Configure location...</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {name && <div className="font-semibold">{name}</div>}
      {address && <div className="text-sm text-gray-600">{address}</div>}
      {(latitude || longitude) && (
        <div className="text-xs text-gray-500">
          {latitude && `Lat: ${latitude}`}
          {latitude && longitude && ", "}
          {longitude && `Long: ${longitude}`}
        </div>
      )}
    </div>
  );
};
