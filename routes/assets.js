module.exports = function(vars) {
    const { express, app, fs, ENV } = vars;
    app.use('/assets', express.static('assets'))
}