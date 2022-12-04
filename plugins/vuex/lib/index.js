'use strict';

const path = require('path')
const Generator = require('@yzl-cli-dev/generator')


class VuexPlugin extends Generator {
  constructor(ctx) {
    super({})
    this.generator = ctx
    this.installPlugin()
  }
  installPlugin() {
    this.generator.extendPackage({
      dependencies: {
        vuex: '^4.0.0'
      }
    })
    console.log('render temnplate');
    this.generator.render(path.resolve(__dirname, '../template/src'), {})
  }
}

module.exports = VuexPlugin;
