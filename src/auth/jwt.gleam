import gleam/result
import plinth/javascript/storage

pub fn save(token: String, storage_key: String) {
  use local_storage <- result.try(storage.session())

  storage.set_item(local_storage, storage_key, token)
}
