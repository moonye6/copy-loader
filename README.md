# copy-loader
一个webpack的插件，用来拷贝一个目录的内容到另一个目录。

## 使用
### 安装
```
npm install copy-loader --save
```
### 配置
```
CopyPlugin = require('copy-loader')
module.exports = {
	output: {
		path: '../dist'
	},
	plugins: [
		new CopyPlugin({
			dirname:'lib',
			template: './lib'
		})
	]
};
```
配置后，web pack会将当前目录lib目录下的所有文件拷贝到目标目录dist/lib下面
