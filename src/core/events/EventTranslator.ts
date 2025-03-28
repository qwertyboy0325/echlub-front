import { Event } from './Event';
import { ErrorHandler } from '../error/ErrorHandler';

/**
 * Event Translator
 * Translates events from one type to another
 */
export class EventTranslator {
    private static instance: EventTranslator | null = null;
    private translations: Map<string, Map<string, (event: Event) => Event>>;
    private errorHandler: ErrorHandler;
    
    private constructor() {
        this.translations = new Map();
        this.errorHandler = ErrorHandler.getInstance();
    }
    
    static getInstance(): EventTranslator {
        if (!EventTranslator.instance) {
            EventTranslator.instance = new EventTranslator();
        }
        return EventTranslator.instance;
    }
    
    addTranslation(sourceType: string, targetType: string, translator: (event: Event) => Event): void {
        if (!this.translations.has(sourceType)) {
            this.translations.set(sourceType, new Map());
        }
        this.translations.get(sourceType)?.set(targetType, translator);
    }
    
    removeTranslation(sourceType: string, targetType: string): void {
        this.translations.get(sourceType)?.delete(targetType);
    }
    
    translate(event: Event): Event | Event[] | undefined {
        const translators = this.translations.get(event.type);
        if (!translators || translators.size === 0) {
            return undefined;
        }
        
        try {
            const results: Event[] = [];
            
            // 嘗試所有翻譯器
            for (const [targetType, translator] of translators) {
                try {
                    const result = translator(event);
                    results.push(result);
                } catch (error) {
                    this.errorHandler.handleError(new Error('Translation error'));
                }
            }
            
            if (results.length === 0) {
                return undefined;
            }
            
            // 如果只有一個結果，返回單個事件
            // 如果有多個結果，返回事件數組
            return results.length === 1 ? results[0] : results;
        } catch (error) {
            this.errorHandler.handleError(new Error(`Error in event translation for ${event.type}: ${error instanceof Error ? error.message : String(error)}`));
            return undefined;
        }
    }
    
    destroy(): void {
        this.translations.clear();
        EventTranslator.instance = null;
    }
} 