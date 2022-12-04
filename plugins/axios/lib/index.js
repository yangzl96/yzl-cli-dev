'use strict';

const Generator = require('@yzl-cli-dev/generator')


class AxiosPlugin extends Generator {
  constructor(ctx) {
    console.log('aaaaaaxios------');
    console.log(ctx);
    super({})
    this.generator = ctx
    this.installPlugin()
  }
  installPlugin() {
    console.log('?????????????????????????');
    this.generator.extendPackage({
      dependencies: {
        axios: '^0.27.2'
      }
    })
    console.log('render temnplate');
    this.generator.render(path.resolve(__dirname, '../template/src'), {})
  }
}

module.exports = AxiosPlugin;
