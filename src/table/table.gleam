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
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import rsvp
import toy
import birl
import gleam/order

pub type Reservation {
  Reservation(
    childs: List(Child),
    token: String,
    total: Int,
    limit: Int,
    page: Int,
  )
}

pub type Child {
  Child(name: String, age: Int, birthday: birl.Time)
}

pub type Msg {
  ApiReturnedChilds(Result(response.Response(String), rsvp.Error))
  ApiNextChilds
  ApiPreviousChilds
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
  let page = 1

  let f = fetch_childs(token, page)

  #(Reservation(childs: [], token: token, total: 0, limit: 10, page:), f)
}

pub fn update(model: Reservation, msg: Msg) -> #(Reservation, Effect(Msg)) {
  case msg {
    ApiReturnedChilds(Ok(resp)) -> {
      let assert Ok(data) = json.decode(resp.body, dynamic.dynamic)

      let decoded_data = toy.decode(data, decode_childs(model))

      case decoded_data {
        Ok(reserv) -> {
          #(reserv, effect.none())
        }
        Error(_) -> {
          #(model, effect.none())
        }
      }
    }

    ApiNextChilds -> {
      case list.length(model.childs) < model.limit {
        True -> #(model, effect.none())
        False -> #(model, fetch_childs(model.token, model.page + 1))
      }
    }

    ApiPreviousChilds -> {
      case model.page <= 1 {
        True -> {
          #(model, effect.none())
        }
        False -> {
          #(model, fetch_childs(model.token, model.page - 1))
        }
      }
    }
    ApiReturnedChilds(Error(_)) -> {
      #(model, effect.none())
    }
  }
}

pub fn fetch_childs(api_token: String, page: Int) {
  io.debug(api_token)
  case uri.parse(env.get_childs) {
    Ok(uri) -> {
      case request.from_uri(uri) {
        Ok(req) -> {
          let request =
            req
            |> request.set_header("authorization", "Bearer " <> api_token)
            |> request.set_query([#("page", int.to_string(page))])

          let handler = rsvp.expect_ok_response(ApiReturnedChilds)

          rsvp.send(request, handler)
        }

        Error(_) -> effect.none()
      }
    }
    Error(_) -> effect.none()
  }
}

pub fn decode_childs(model: Reservation) {
  use childs <- toy.field(
    "data",
    toy.list({
      use name <- toy.field("name", toy.string)
      use age <- toy.field("age", toy.int)
      use birthday <- toy.field(
        "birthday",
        time_decoder()
      )

      toy.decoded(Child(name:, age:, birthday:))
    })
      |> toy.list_nonempty,
  )

  use total <- toy.field("total", toy.int)
  use limit <- toy.field("limit", toy.int)
  use page <- toy.field("page", toy.int)

  toy.decoded(Reservation(..model, childs:, total:, limit:, page:))
}

pub fn time_decoder() {
  toy.string
  |> toy.try_map(birl.now(), fn(val) {
    birl.parse(val)
    |> result.replace_error([toy.ToyError(toy.InvalidType("DateTime", val), [])])
  })
}

pub fn time_future(val: birl.Time) {
  case birl.compare(val, birl.now()) {
    order.Gt -> Ok(Nil)
    _ ->{
      io.debug(val)
      Error([
        toy.ToyError(
          toy.ValidationFailed("date_future", "DateTime", birl.to_http(val)),
          [],
        ),
      ])
    }
  }
}

pub fn view(model: Reservation) -> Element(Msg) {
  let total = int.to_string(model.total)
  let limit = int.to_string(model.limit)
  let page = int.to_string(model.page)

  let table_style = [
    #("width", "100%"),
    #("margin-bottom", "20px"),
    #("border", "15px solid #F2F8F8"),
    #("border-top", "5px solid #F2F8F8"),
    #("border-collapse", "collapse"),
  ]

  let table_th_style = [
    #("font-weight", "bold"),
    #("padding", "5px"),
    #("border", "none"),
    #("background", "#F2F8F8"),
    #("border-bottom", "5px solid #F2F8F8"),
    #("text-align", "left"),
  ]

  let table_td_style = [
    #("padding", "5px"),
    #("border-bottom", "5px solid #F2F8F8"),
    #("border", "none"),
  ]

  let info_style = [
    #("display", "flex"),
    #("gap", "5px"),
    #("margin-bottom", "10px"),
  ]

  html.div([], [
    html.div([attribute.style(info_style)], [
      html.span([], [element.text("Info: ")]),
      html.div([attribute.style([#("display", "flex"), #("gap", "10px")])], [
        html.span([], [element.text("Total childs: " <> total)]),
        html.span([], [element.text("Limit rows: " <> limit)]),
        html.span([], [element.text("Page number: " <> page)]),
      ]),
    ]),
    html.table([attribute.style(table_style)], [
      html.tr([], [
        html.th([attribute.style(table_th_style)], [element.text("full name")]),
        html.th([attribute.style(table_th_style)], [element.text("age")]),
        html.th([attribute.style(table_th_style)], [element.text("birthday")]),
      ]),
      html.tbody(
        [],
        list.map(model.childs, fn(child) {
          html.tr([], [
            html.td([attribute.style(table_td_style)], [
              element.text(child.name),
            ]),
            html.td([attribute.style(table_td_style)], [
              element.text(int.to_string(child.age)),
            ]),
            html.td([attribute.style(table_td_style)], [
              element.text(birl.to_date_string(child.birthday)),
            ]),
          ])
        }),
      ),
    ]),
    html.div([attribute.style([#("display", "flex"), #("gap", "10px")])], [
      ui.button([event.on_click(ApiPreviousChilds)], [element.text("<")]),
      ui.button([event.on_click(ApiNextChilds)], [element.text(">")]),
    ]),
  ])
}
