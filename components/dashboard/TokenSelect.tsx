import { Token } from "@/constants/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  tokens: Token[];
  selectedToken: Token | null;
  setSelectedTokenAddress: (address: `0x${string}`) => void;
}

export const TokenSelect = ({
  tokens,
  selectedToken,
  setSelectedTokenAddress,
}: Props) => {
  return (
    <div className="w-full max-w-sm">
      <Select
        value={selectedToken?.address ?? ""}
        onValueChange={(value: (typeof tokens)[number]["address"]) =>
          setSelectedTokenAddress(value)
        }
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              selectedToken
                ? `${selectedToken.symbol} - ${selectedToken.name}`
                : "Select a token"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {tokens.map((token) => (
            <SelectItem key={token.address} value={token.address}>
              {token.symbol} - {token.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
