import { MessageProvider, Replacements } from './types';
declare const _default: {
    loadFromLocale: (locale?: string) => void;
    __: (id: string, replacements?: Replacements) => string;
    addProvider: (id: string, messageProvider: MessageProvider) => void;
};
export default _default;
