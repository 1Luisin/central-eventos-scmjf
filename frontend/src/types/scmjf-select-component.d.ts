declare module "@scmjf/select-component" {
  import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

  export type ScmjfSelectOption = {
    value: string | number;
    label: ReactNode;
    disabled?: boolean;
  };

  export type ScmjfSelectChangeEvent = {
    target: {
      name?: string;
      value: string;
      option?: unknown;
    };
    currentTarget: {
      name?: string;
      value: string;
      option?: unknown;
    };
  };

  export type ScmjfSelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onChange" | "value"> & {
    children?: ReactNode;
    disabled?: boolean;
    emptyMessage?: string;
    name?: string;
    onChange?: (event: ScmjfSelectChangeEvent) => void;
    options?: ScmjfSelectOption[];
    placeholder?: string;
    required?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    value?: string | number | null;
  };

  export default function ScmjfSelect(props: ScmjfSelectProps): ReactElement;
  export { ScmjfSelect };
}
