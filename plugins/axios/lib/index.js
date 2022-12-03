'use strict';

const Generator = require('@yzl-cli-dev/generator')


class AxiosPlugin extends Generator {
  constructor(ctx) {
    super({})
    this.generator = ctx
    this.installPlugin()
  }
  installPlugin() {
    this.generator.extendPackage({
      dependencies: {
        axios: '^0.27.2'
      }
    })
    this.generator.render(path.resolve(__dirname, '../template/src'), {})
  }
}

module.exports = AxiosPlugin;
