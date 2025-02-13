import env
import gleam/result
import plinth/javascript/storage

pub fn save(token: String) {
  use stor <- result.try(storage.session())
  use res <- result.try(storage.set_item(stor, env.jwt_key, token))

  Ok(res)
}

pub fn fetch() -> Result(String, Nil) {
  use stor <- result.try(storage.session())
  use item <- result.try(storage.get_item(stor, env.jwt_key))

  Ok(item)
}

pub fn delete() {
  use stor <- result.try(storage.session())

  Ok(storage.remove_item(stor, env.jwt_key))
}
