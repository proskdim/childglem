import auth/jwt
import env
import gleam/dynamic
import gleam/http/request
import gleam/http/response
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/result
import gleam/uri
import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import rsvp
import toy

pub type Reservation {
  Reservation(childs: List(Child), total: Int, limit: Int, page: Int)
}

pub type Child {
  Child(name: String, age: Int)
}

pub type Msg {
  ApiReturnedChilds(Result(response.Response(String), rsvp.Error))
}

pub fn main() {
  let app = app()
  let assert Ok(_) = lustre.start(app, "#app", 0)
}

pub fn app() {
  lustre.application(init, update, view)
}

pub fn init(_flags) -> #(Reservation, Effect(Msg)) {
  let token = result.unwrap(jwt.fetch(), "")

  let f = fetch_childs(token)

  #(Reservation(childs: [], total: 0, limit: 10, page: 1), f)
}

pub fn update(model: Reservation, msg: Msg) -> #(Reservation, Effect(Msg)) {
  case msg {
    ApiReturnedChilds(Ok(resp)) -> {
      let assert Ok(data) = json.decode(resp.body, dynamic.dynamic)

      let decoded_data = toy.decode(data, decode_childs())

      case decoded_data {
        Ok(reserv) -> {
          #(reserv, effect.none())
        }
        Error(_) -> {
          #(model, effect.none())
        }
      }
    }

    ApiReturnedChilds(Error(_)) -> {
      #(model, effect.none())
    }
  }
}

pub fn fetch_childs(api_token: String) {
  io.debug(api_token)
  case uri.parse(env.get_childs) {
    Ok(uri) -> {
      case request.from_uri(uri) {
        Ok(req) -> {
          let request =
            request.set_header(req, "authorization", "Bearer " <> api_token)
          let handler = rsvp.expect_ok_response(ApiReturnedChilds)

          rsvp.send(request, handler)
        }

        Error(_) -> effect.none()
      }
    }
    Error(_) -> effect.none()
  }
}

pub fn decode_childs() {
  use childs <- toy.field(
    "data",
    toy.list({
      use name <- toy.field("name", toy.string)
      use age <- toy.field("age", toy.int)
      toy.decoded(Child(name:, age:))
    })
      |> toy.list_nonempty,
  )

  use total <- toy.field("total", toy.int)
  use limit <- toy.field("limit", toy.int)
  use page <- toy.field("page", toy.int)

  toy.decoded(Reservation(childs:, total:, limit:, page:))
}

pub fn view(model: Reservation) -> Element(Msg) {
  let total = int.to_string(model.total)
  let limit = int.to_string(model.limit)
  let page = int.to_string(model.page)

  html.div([], [
    element.text("Total: " <> total),
    element.text("Limit: " <> limit),
    element.text("Page: " <> page),
    html.ol(
      [],
      list.map(model.childs, fn(child) {
        html.li([], [element.text(child.name)])
      }),
    ),
  ])
}
