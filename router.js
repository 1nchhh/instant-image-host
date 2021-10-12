module.exports = (vars) => {
  const { fs } = vars
  for (i of fs.readdirSync(vars.path.join(__dirname, './routes'))) {
    if (i.endsWith('.js')) {
      console.log('./routes/' + i)
      require('./routes/' + i)(vars)
    }
  }
}