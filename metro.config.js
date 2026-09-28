// Configuración de Metro. Solo existe para que el bundler ignore la
// carpeta `fatro-app/`, una copia local de la instalación WordPress de
// Fatro que se usa para análisis y está fuera de git. Sin esto Metro
// vigila sus ~200 MB de ficheros PHP/JS y ralentiza el arranque.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const fatroCopy = path.join(__dirname, 'fatro-app');
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  new RegExp(`^${fatroCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`),
];

module.exports = config;
