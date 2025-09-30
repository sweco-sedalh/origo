import utils from '../utils';

export default function renderError(type: "browser", el: HTMLElement) {
  function renderBrowserError(element: HTMLElement) {
    const message = 'Det ser ut som att du använder en föråldrad webbläsare. Prova att uppgradera din webbläsare för att visa kartan.';
    const elMessage = utils.createElement('div', message, {
      cls: 'o-no-map-message'
    });
    const container = utils.createElement('div', elMessage, {
      cls: 'o-no-map'
    });
    element.append(container);
  }

  if (type === 'browser') {
    renderBrowserError(el);
  }
}
