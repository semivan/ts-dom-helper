import { interpolate } from './interpolate';

type HTMLElements = HTMLElement | HTMLElement[] | NodeListOf<HTMLElement> | string;

function isIterable(el: unknown): boolean {
    return !!el
        && typeof el === 'object'
        && Symbol.iterator in el
        && typeof el[Symbol.iterator] === 'function';
}

function ready(fn: () => unknown) {
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', fn)
        : fn();
}

function create<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: ElementCreationOptions,
): HTMLElementTagNameMap[K] {
    return document.createElement(tagName, options);
}

function find<E extends HTMLElement = HTMLElement>(
    selector: string,
    fromElement: HTMLElement = document.body,
): E | null {
    return fromElement.querySelector(selector);
}

function findAll<E extends HTMLElement = HTMLElement>(
    selector: string,
    fromElement: HTMLElement = document.body,
): NodeListOf<E> {
    return fromElement.querySelectorAll(selector);
}

function get<E extends HTMLElement = HTMLElement>(
    selector: string,
    fromElement: HTMLElement = document.body,
): E {
    const element = find<E>(selector, fromElement);

    if (!element) {
        throw new Error(`The "${selector}" element was not found`);
    }

    return element;
}

function elementMap<TElement extends HTMLElement = HTMLElement, TReturnItem = unknown>(
    elements: HTMLElements,
    callback: (el: TElement) => TReturnItem,
): TReturnItem[] {
    if (elements instanceof Element) {
        return [callback(elements as TElement)];
    }

    const results: TReturnItem[] = [];
    let iterableElements: HTMLElement[] | NodeListOf<HTMLElement> = [];

    if (typeof elements === 'string') {
        iterableElements = findAll(elements);
    } else if (isIterable(elements)) {
        iterableElements = elements;
    }

    for (const el of iterableElements) {
        results.push(callback(el as TElement));
    }

    return results;
}

function addEventListener(
    element: HTMLElements,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
): void {
    if (!(element instanceof Element)) {
        elementMap(element, el => addEventListener(el, type, listener, options));

        return;
    }

    element.addEventListener(type, listener, options);
}

function removeEventListener(
    element: HTMLElements,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
): void {
    if (!(element instanceof Element)) {
        elementMap(element, el => removeEventListener(el, type, listener, options));

        return;
    }

    element.removeEventListener(type, listener, options);
}

function loadTemplate(id: string, params: object = {}): string {
    const template = get<HTMLTemplateElement>(`#${id}`);

    return interpolate(template.innerHTML, params);
}

function htmlToElement<E extends HTMLElement = HTMLElement>(html: string): E | null;
function htmlToElement<K extends keyof HTMLElementTagNameMap>(html: string, wrapperTag: K): HTMLElementTagNameMap[K];
/**
 * Convert an HTML string to an element.
 * If wrapperTag is not specified, returns the first found parent element from the HTML string.
 *
 * @param {string} html - The HTML string.
 * @param {keyof HTMLElementTagNameMap} wrapperTag - The element tag to wrap in.
 * @returns {HTMLElement|Element} - The converted element.
 */
function htmlToElement(html: string, wrapperTag?: keyof HTMLElementTagNameMap) {
    const wrapper = document.createElement(wrapperTag ?? 'template');

    wrapper.innerHTML = html.trim();

    if (wrapperTag) {
        return wrapper;
    }

    if (wrapper instanceof HTMLTemplateElement) {
        return wrapper.content.firstElementChild;
    }

    return wrapper.firstElementChild;
}

function hide(element: HTMLElements): void {
    if (!(element instanceof Element)) {
        elementMap(element, el => hide(el));

        return;
    }

    element.classList.add('d-none');
}

function show(element: HTMLElements): void {
    if (!(element instanceof Element)) {
        elementMap(element, el => show(el));

        return;
    }

    element.classList.remove('d-none');
}

function fadeIn(element: HTMLElements, toOpacity: number = 1, delay: number = 50): Promise<void> {
    if (!(element instanceof Element)) {
        const result = elementMap(element, el => fadeIn(el, toOpacity, delay));

        if (result.length) result.pop();

        return Promise.resolve();
    }

    let opacity = parseFloat(element.style.opacity) || 0;

    toOpacity = toOpacity > 1 ? 1 : toOpacity;
    toOpacity = toOpacity < 0 ? 0 : toOpacity;

    return new Promise(resolve => {
        const timerId = setInterval(() => {
            opacity = ((opacity * 10) + 1) / 10;

            if (toOpacity > 0) {
                show(element);
            }

            if (opacity > toOpacity) {
                resolve();
                clearInterval(timerId);

                return;
            }

            element.style.opacity = String(opacity);
        }, delay);
    });
}

function fadeOut(element: HTMLElement, toOpacity: number = 0, delay: number = 50): Promise<void> {
    if (!(element instanceof Element)) {
        const result = elementMap(element, el => fadeOut(el, toOpacity, delay));

        if (result.length) result.pop();

        return Promise.resolve();
    }

    let opacity = parseFloat(element.style.opacity) || 0;

    toOpacity = toOpacity > 1 ? 1 : toOpacity;
    toOpacity = toOpacity < 0 ? 0 : toOpacity;

    return new Promise(resolve => {
        const timerId = setInterval(() => {
            opacity = ((opacity * 10) - 1) / 10;

            if (opacity < toOpacity) {
                resolve();
                clearInterval(timerId);
                hide(element);

                return;
            }

            element.style.opacity = String(opacity);
        }, delay);
    });
}

const dom = {
    ready,
    create,
    find,
    findAll,
    get,
    elementMap,
    addEventListener,
    removeEventListener,
    loadTemplate,
    htmlToElement,
    hide,
    show,
    fadeIn,
    fadeOut,
};

export default dom;
