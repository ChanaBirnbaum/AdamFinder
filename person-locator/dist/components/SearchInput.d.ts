import React from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
interface SearchInputProps {
    inputValue: string;
    onInputChange: (v: string) => void;
    onClear: () => void;
    onFocus?: () => void;
    disabled?: boolean;
    lockedType?: PersonType;
    typeFilter?: PersonType;
    onTypeFilterChange?: (type: PersonType | undefined) => void;
    activeOnly?: PersonLocatorProps['activeOnly'];
    isDefaultActive?: PersonLocatorProps['isDefaultActive'];
    minChars?: number;
    onActiveToggle?: (active: boolean) => void;
    activeToggleValue?: boolean;
    isOpen?: boolean;
}
declare const SearchInput: React.FC<SearchInputProps>;
export default SearchInput;
