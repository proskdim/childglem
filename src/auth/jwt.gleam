import env
import gleam/result
import plinth/javascript/storage

pub fn save(token: String) {
  use storage <- result.try(storage.session())

  storage.set_item(storage, env.jwt_key, token)
}
