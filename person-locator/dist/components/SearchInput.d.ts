import React from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
interface SearchInputProps {
    inputValue: string;
    onInputChange: (v: string) => void;
    onClear: () => void;
    disabled?: boolean;
    type?: PersonType;
    activeOnly?: PersonLocatorProps['activeOnly'];
    isDefaultActive?: PersonLocatorProps['isDefaultActive'];
    minChars?: number;
    onActiveToggle?: (active: boolean) => void;
    activeToggleValue?: boolean;
}
declare const SearchInput: React.FC<SearchInputProps>;
export default SearchInput;
