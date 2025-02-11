import env
import gleam/dynamic
import gleam/io
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/result
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre_http
import plinth/javascript/storage

pub type Auth {
  Auth(email: String, password: String, result: AuthResult)
}

pub type AuthResult {
  AuthResult(signup: Option(String))
}

pub type Msg {
  Init
  EmailUpdateInput(value: String)
  PasswordUpdateInput(value: String)

  SendAuth
  GotResponseAuth(Result(SigninResponse, lustre_http.HttpError))
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
  #(Auth(AuthResult(signup: None), email: "", password: ""), effect.none())
}

pub fn update(model: Auth, msg: Msg) -> #(Auth, Effect(Msg)) {
  case msg {
    Init -> #(model, effect.none())
    EmailUpdateInput(email) -> #(Auth(..model, email: email), effect.none())
    PasswordUpdateInput(password) -> #(
      Auth(..model, password: password),
      effect.none(),
    )

    SendAuth -> {
      let email = model.email
      let password = model.password

      #(model, send_auth(email, password))
    }

    GotResponseAuth(Ok(resp)) -> {
      let _ = save_jwt_token(resp.jwt_token)

      #(
        Auth(..model, result: AuthResult(signup: Some("success authorization"))),
        effect.none(),
      )
    }
    GotResponseAuth(Error(http_error)) -> {
      case http_error {
        lustre_http.InternalServerError(_) -> #(
          Auth(
            ..model,
            result: AuthResult(signup: Some("internal server error")),
          ),
          effect.none(),
        )
        lustre_http.NotFound -> #(
          Auth(..model, result: AuthResult(signup: Some("user not found"))),
          effect.none(),
        )
        _ -> #(
          Auth(
            ..model,
            result: AuthResult(signup: Some("failed authorization")),
          ),
          effect.none(),
        )
      }
    }
  }
}

pub fn save_jwt_token(token: String) {
  use local_storage <- result.try(storage.local())
  storage.set_item(local_storage, "jwt_token", token)
}

pub fn send_auth(email: String, password: String) -> Effect(Msg) {
  let payload =
    json.object([
      #("email", json.string(email)),
      #("password", json.string(password)),
    ])

  let decoder =
    dynamic.decode1(SigninResponse, dynamic.field("jwt_token", dynamic.string))

  lustre_http.post(
    env.post_signin,
    payload,
    lustre_http.expect_json(decoder, GotResponseAuth),
  )
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
            case model.result.signup {
              Some(text) -> html.div([], [element.text(text)])
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
