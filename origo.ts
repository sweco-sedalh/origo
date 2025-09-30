import { Feature as olFeature, Collection as olCollection, Overlay as olOverlay } from 'ol';
import * as olGeom from 'ol/geom';
import { fromCircle, fromExtent } from 'ol/geom/Polygon';
import * as olInteraction from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import * as olLayer from 'ol/layer';
import * as olSource from 'ol/source';
import * as olStyle from 'ol/style';
import * as olFormat from 'ol/format';
import * as ui from './src/ui.js';
import Viewer from './src/viewer.js';
import loadResources from './src/loadresources.js';
import titleCase from './src/utils/titlecase.js';
import * as origoControls from './src/controls.js';
import * as origoExtensions from './src/extensions/index.js';
import supports from './src/utils/supports.js';
import renderError from './src/utils/rendererror.js';
import Style from './src/style.js';
import featurelayer from './src/featurelayer.js';
import getFeatureInfo from './src/getfeatureinfo.js';
import getFeature from './src/getfeature.js';
import * as Utils from './src/utils.js';
import dropdown from './src/dropdown.js';
import { renderSvgIcon } from './src/utils/legendmaker.js';
import SelectedItem from './src/models/SelectedItem.js';
import 'elm-pep';
import 'pepjs';
import 'drag-drop-touch';
import permalink from './src/permalink/permalink.js';
import * as Loader from './src/loading.js';
import Spinner from './src/utils/spinner.js';
import layerType from './src/layer/layertype.js';

export interface Options {
    target: string | HTMLElement;
    controls: [],
    featureinfoOptions: any;
    crossDomain: boolean;
    keyboardEventTarget: HTMLElement | Document | Window;
    svgSpritePath: string;
    svgSprites: string[];
    breakPoints: {
      xs: number[];
      s: number[];
      m: number[];
      l: number[];
    };
    breakPointsPrefix: string;
    defaultControls: { name: string }[];
    baseUrl?: string;
}

const Origo = function Origo(configPath, options: Partial<Options> = {}) {
  /** Reference to the returned Component */
  let origo;
  let viewer;
  const origoConfig: Options = {
    controls: [],
    featureinfoOptions: {},
    crossDomain: true,
    target: '#app-wrapper',
    keyboardEventTarget: document,
    svgSpritePath: 'css/svg/',
    svgSprites: ['fa-icons.svg', 'material-icons.svg', 'miscellaneous.svg', 'origo-icons.svg', 'custom.svg'],
    breakPoints: {
      xs: [240, 320],
      s: [320, 320],
      m: [500, 500],
      l: [768, 500]
    },
    breakPointsPrefix: 'o-media',
    defaultControls: [
      { name: 'localization' },
      { name: 'scaleline' },
      { name: 'zoom' },
      { name: 'rotate' },
      { name: 'attribution' },
      { name: 'fullscreen' }
    ]
  };

  const isSupported = supports();
  const el = options.target || origoConfig.target;
  if (!isSupported) {
    renderError('browser', typeof el === "string" ? document.querySelector(el) : el);
    return null;
  }

  const initControls = async (controlDefs) => {
    const locControlDefs = controlDefs.shift(); // Localization is first of the defaultControls;

    if (!(locControlDefs.options)) {
      locControlDefs.options = {
        localeId: 'sv-SE'
      };
    }

    // a potential loc query param for Localization needs to be set
    const localizationComponent = origoControls.Localization(locControlDefs.options);
    localizationComponent.options = locControlDefs.options;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('loc')) {
      const localization = searchParams.get('loc');
      localizationComponent.setLocale(localization);
    }

    const restControls = await Promise.all(
      controlDefs
        .filter((def) => 'name' in def)
        .map(async (def) => {
          // support both built-in and user-supplied (which might be lazy-loaded) controls
          const controlFactory = origoControls[titleCase(def.name)] ?? options.controls[def.name];
          if (!controlFactory) {
            throw new Error(`Unknown control '${def.name}'`);
          }

          const controlOptions = { ...def.options, localization: localizationComponent };
          // controlFactory can be either a function to create a control (built-in and non-lazy loaded) or a function
          // to create a Promise that loads the function that creates the control
          const controlOrLazyLoadedFactory = await controlFactory(controlOptions);
          const control = typeof controlOrLazyLoadedFactory === 'function' ? controlOrLazyLoadedFactory(controlOptions) : controlOrLazyLoadedFactory;
          control.options = { ...control.options, ...controlOptions };
          return control;
        })
    );
    return [localizationComponent, ...restControls];
  };

  const initExtensions = (extensionDefs) => {
    const extensions = [];
    extensionDefs.forEach((def) => {
      if ('name' in def) {
        const extensionName = titleCase(def.name);
        const extensionOptions = def.options || {};
        if (extensionName in origoExtensions) {
          const extension = origoExtensions[extensionName](extensionOptions);
          extensions.push(extension);
        }
      }
    });
    return extensions;
  };

  const api = () => viewer;
  const getConfig = () => origoConfig;

  api.controls = () => origoControls;
  api.extensions = () => origoExtensions;

  /** Helper that initialises a new viewer  */
  const initViewer = () => {
    const defaultConfig = Object.assign({}, origoConfig, options);
    loadResources(configPath, defaultConfig)
      .then(async (data) => {
        const viewerOptions = data.options;
        viewerOptions.controls = await initControls(viewerOptions.controls);
        viewerOptions.extensions = initExtensions(viewerOptions.extensions || []);
        return viewerOptions;
      })
      .then((viewerOptions) => {
        const target = viewerOptions.target;
        viewer = Viewer(target, viewerOptions);
        viewer.on('loaded', () => {
          // Inform listeners that there is a new Viewer in town
          origo.dispatch('load', viewer);
        });
      })
      .catch(error => console.error(error));
  };
  // Add a listener to handle a new sharemap when using hash format.
  window.addEventListener('hashchange', (ev) => {
    const newParams = permalink.parsePermalink(ev.newURL);

    if (newParams.map) {
      // "Reboot" the application by creating a new viewer instance using the original configuration and the new sharemap state
      initViewer();
    }
  });

  return ui.Component({
    api,
    getConfig,
    onInit() {
      const defaultConfig = Object.assign({}, origoConfig, options);
      const base = document.createElement('base');
      base.href = defaultConfig.baseUrl;
      document.getElementsByTagName('head')[0].appendChild(base);
      origo = this;
      initViewer();
    }
  });
};

// @ts-ignore
olInteraction.Draw.createBox = createBox;
// @ts-ignore
olGeom.Polygon.fromCircle = fromCircle;
// @ts-ignore
olGeom.Polygon.fromExtent = fromExtent;
Origo.controls = origoControls;
Origo.extensions = origoExtensions;
Origo.ui = ui;
Origo.Style = Style;
Origo.featurelayer = featurelayer;
Origo.getFeatureInfo = getFeatureInfo;
Origo.getFeature = getFeature;
Origo.ol = {
    geom: olGeom,
    interaction: olInteraction,
    layer: olLayer,
    source: olSource,
    style: olStyle,
    format: olFormat,
    Feature: olFeature,
    Collection: olCollection,
    Overlay: olOverlay,
};
Origo.Utils = Utils;
Origo.dropdown = dropdown;
Origo.renderSvgIcon = renderSvgIcon;
Origo.SelectedItem = SelectedItem;
Origo.Loader = {
    showLoading: Loader.showLoading,
    hideLoading: Loader.hideLoading,
    withLoading: Loader.withLoading,
    getInlineSpinner: Spinner,
};
Origo.layerType = layerType;

import "./scss/origo.scss";

export { ConfigurationSchema } from "./src/config";

export default Origo;

// import { ConfigurationSchema } from "origo/config";