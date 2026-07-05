import React from 'react';
import type { PersonLocatorProps, PersonResult } from '../types';
interface ResultCardProps {
    person: PersonResult;
    query: string;
    isLast?: boolean;
    lastRef?: (node: HTMLElement | null) => void;
    onSelect: (person: PersonResult) => void;
    openTikAsir?: PersonLocatorProps['openTikAsir'];
    navigate?: PersonLocatorProps['navigate'];
    HidePhotosSugAdam?: PersonLocatorProps['HidePhotosSugAdam'];
    displayIdNumber?: PersonLocatorProps['displayIdNumber'];
    HideMishmorot?: PersonLocatorProps['HideMishmorot'];
    hideNavigationLinks?: PersonLocatorProps['hideNavigationLinks'];
    additionalResultFields?: string[];
}
declare const ResultCard: React.FC<ResultCardProps>;
export default ResultCard;
