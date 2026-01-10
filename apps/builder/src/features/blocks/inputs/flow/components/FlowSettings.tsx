import { BasicSelect } from "@/components/inputs/BasicSelect";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTranslate } from "@tolgee/react";
import { defaultFlowOptions } from "@typebot.io/blocks-inputs/flow/constants";
import type { FlowInputBlock } from "@typebot.io/blocks-inputs/flow/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { MoreInfoTooltip } from "@typebot.io/ui/components/MoreInfoTooltip";
import type { Variable } from "@typebot.io/variables/schemas";

type Props = {
  options: FlowInputBlock["options"];
  onOptionsChange: (options: FlowInputBlock["options"]) => void;
};

export const FlowSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateFlowId = (flowId: string) =>
    onOptionsChange({ ...options, flowId });

  const updateFlowCta = (flowCta: string) =>
    onOptionsChange({ ...options, flowCta });

  const updateFlowAction = (flowAction?: string) =>
    onOptionsChange({
      ...options,
      flowAction: flowAction as "navigate" | "data_exchange" | undefined,
    });

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>
          Flow ID
          <MoreInfoTooltip>
            The ID of the WhatsApp Flow. Flows must be created in WhatsApp
            Business Manager before use.
          </MoreInfoTooltip>
        </Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.flowId ?? defaultFlowOptions.flowId}
          onValueChange={updateFlowId}
          placeholder="123456789"
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Button Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.flowCta ?? defaultFlowOptions.flowCta}
          onValueChange={updateFlowCta}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Flow Action</Field.Label>
        <BasicSelect
          value={options?.flowAction}
          defaultValue={defaultFlowOptions.flowAction}
          items={["navigate", "data_exchange"]}
          onChange={updateFlowAction}
          placeholder="Select action..."
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.inputs.settings.saveAnswer.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={updateVariableId}
        />
      </Field.Root>
    </div>
  );
};
