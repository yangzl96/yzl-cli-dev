# lulu-cli

## Project-setup

### 全局安装 lerna:

`npm install lerna@4.0.0 -g`

### 安装所有依赖:

`lerna bootstrap`

### 链接本地依赖:

`lerna link` **注意:本地依赖可能会出现链接不存在的问题，切换到对应目录，手动执行 npm instal1**

### 注册全局指令 lulu:

`cd core/cli &npm link`

## Publish

`lerna publish **注意:发布前，先 commit 代码**
