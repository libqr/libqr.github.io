module.exports = function override(config, env) {
	config.resolve.alias['@'] = require('path').resolve('src')
	config.optimization.minimizer = [((opt) => new opt({ extractComments: false }))(require('terser-webpack-plugin'))]
	config.ignoreWarnings = [/Failed to parse source map/]
	switch (env) {
		case 'production':
			config.devtool = false
			config.externals = {
				// react: 'React',
				// 'react-dom': 'ReactDOM',
				// 'react-router-dom': 'ReactRouterDOM',
			}
			break
		default:
			config.devtool = 'source-map'
			break
	}
	return config
}
