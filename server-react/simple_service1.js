const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const cors = require('koa-cors')
const fs = require('fs')
const path = require('path')
const {set_random_port} = require('./port_share')

const data_JSON_path = './temp/data.json'

const second_service_port = set_random_port()
const {fetchy_util: connection_second_service} = require('./request_util')(`http://localhost:${second_service_port}`)

const is_exist_JSON_data = () => fs.existsSync(path.resolve(process.cwd(), data_JSON_path))

function save_JSON_data(data) {
  if(is_exist_JSON_data()) {
    const existing_JSON_data = JSON.parse(require(data_JSON_path))
    if(Array.isArray(existing_JSON_data)) {
      existing_JSON_data.push(data)
      fs.unlink(data_JSON_path)
      fs.writeFileSync(data_JSON_path, JSON.stringify(existing_JSON_data))
    }
  }
}
// if json file does not exist  return {json_data: 'not found'}
function get_JSON_data() {
  if(is_exist_JSON_data()) {
    return require(data_JSON_path)
  } else {
    return {json_data: 'not found'}
  }
}

// if data cant be converted to JSON will return error
function dataToJSON(data) {
  try {
    save_JSON_data(data)
    return {ok: 'ok'}
  }
  catch(e) {
    return {not_ok: 'data cant be converted in JSON format'}
  }
}

// service works with JSON format files

const servise_1_action_types = {
  ASSERT_CONNECTION: 'ASSERT_CONNECTION',
  ASSERT_CONNECTION_ENVIRONMENT: 'ASSERT_CONNECTION_ENVIRONMENT',
  SAVE_JSON_DATA: 'SAVE_JSON_DATA',
  GET_JSON_DATA: 'GET_JSON_DATA',

}

const app = new Koa()
app.use(cors())
app.use(bodyParser())

const request_worker = async (cntx) => {
  const {request: {body: {action, token, username}}} = cntx

  switch(action) {
    case servise_1_action_types.ASSERT_CONNECTION:
      return cntx.body = {connection: 'ok'}
    case servise_1_action_types.ASSERT_CONNECTION_ENVIRONMENT: {
      const {body} = await connection_second_service.post('/', {action: 'ASSERT_CONNECTION'})
      if(body.connection) {
        return cntx.body = {service_connection: 'ok'}
      }
      return cntx.body = {service_connection: 'service connection not aviliable'}
    }
    default:
      return cntx.body = {ok: 'ok'}
  }
}
// set random port for service_
set_random_port()
const {fetchy_util} = require('./request_util')('http://localhost:8080')
app.use(request_worker)

app.listen(8081)
