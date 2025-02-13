import auth/jwt
import env
import gleam/dynamic/decode
import gleam/json
import gleam/option.{type Option, None, Some}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import plinth/browser/window
import rsvp

const http_200 = "success authorization"

const http_fail = "failed authorization"

pub type Auth {
  Auth(email: String, password: String, response: Option(String))
}

pub type Msg {
  Init
  EmailUpdateInput(value: String)
  PasswordUpdateInput(value: String)

  SendAuth
  ApiAuthPost(Result(SigninResponse, rsvp.Error))
}

pub type SigninResponse {
  SigninResponse(jwt_token: String)
}

pub fn main() {
  let app = app()
  let assert Ok(_) = lustre.start(app, "#app", 0)
}

pub fn app() {
  lustre.application(init, update, view)
}

pub fn init(_flags) -> #(Auth, Effect(Msg)) {
  #(Auth(email: "", password: "", response: None), effect.none())
}

pub fn update(model: Auth, msg: Msg) -> #(Auth, Effect(Msg)) {
  case msg {
    Init -> {
      #(model, effect.none())
    }

    EmailUpdateInput(email) -> {
      #(Auth(..model, email: email), effect.none())
    }

    PasswordUpdateInput(password) -> {
      #(Auth(..model, password: password), effect.none())
    }

    SendAuth -> {
      #(model, authorization(model))
    }

    ApiAuthPost(Ok(r)) -> {
      case jwt.save(r.jwt_token) {
        Ok(_) -> {
          window.reload()
          #(Auth(..model, response: Some(http_200)), effect.none())
        }
        Error(_) -> {
          #(Auth(..model, response: Some(http_fail)), effect.none())
        }
      }
    }
    ApiAuthPost(Error(_)) -> {
      #(Auth(..model, response: Some(http_fail)), effect.none())
    }
  }
}

fn authorization(user: Auth) -> Effect(Msg) {
  let body =
    json.object([
      #("email", json.string(user.email)),
      #("password", json.string(user.password)),
    ])

  let handler = rsvp.expect_json(decode_auth(), ApiAuthPost)
  rsvp.post(env.post_signin, body, handler)
}

pub fn decode_auth() {
  use token <- decode.field("jwt_token", decode.string)
  decode.success(SigninResponse(jwt_token: token))
}

pub fn view(model: Auth) -> Element(Msg) {
  html.div([], [
    // ui centre
    ui.centre(
      [],
      // ui aside
      ui.aside(
        [attribute.style([#("margin-left", "300px"), #("margin-top", "50px")])],
        html.div([], [
          html.div([], [
            case model.response {
              Some(result) -> html.div([], [element.text(result)])
              None -> html.div([], [element.text("")])
            },
          ]),
        ]),
        // ui aside
        ui.aside(
          [],
          html.h1([attribute.style([#("font-weight", "bold")])], [
            element.text("Authorization form: "),
          ]),
          // ui aside
          ui.aside(
            [
              attribute.style([
                #("display", "flex"),
                #("flex-direction", "column"),
              ]),
            ],
            html.div([], [
              ui.aside(
                [],
                ui.field(
                  [],
                  [element.text("Write Email: ")],
                  ui.input([
                    attribute.value(model.email),
                    event.on_input(EmailUpdateInput),
                  ]),
                  [],
                ),
                ui.field(
                  [],
                  [element.text("Write password: ")],
                  ui.input([
                    attribute.value(model.password),
                    event.on_input(PasswordUpdateInput),
                    attribute.type_("password"),
                  ]),
                  [],
                ),
              ),
            ]),
            ui.button([event.on_click(SendAuth)], [element.text("Send")]),
          ),
        ),
      ),
    ),
  ])
}
