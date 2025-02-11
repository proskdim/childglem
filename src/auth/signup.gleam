import env
import gleam/json
import gleam/option.{type Option, None, Some}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre_http

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
  GotResponseAuth(Result(Nil, lustre_http.HttpError))
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

    GotResponseAuth(Ok(_)) -> {
      #(
        Auth(
          ..model,
          result: AuthResult(signup: Some("success authentication")),
        ),
        effect.none(),
      )
    }
    GotResponseAuth(Error(http_error)) -> {
      case http_error {
        lustre_http.OtherError(_, _) -> #(
          Auth(..model, result: AuthResult(signup: Some("user already exist"))),
          effect.none(),
        )
        lustre_http.InternalServerError(_) -> #(
          Auth(..model, result: AuthResult(signup: Some("internal server error"))),
          effect.none(),
        )
        _ -> #(
          Auth(..model, result: AuthResult(signup: Some("failed authentication"))),
          effect.none(),
        )
      }
    }
  }
}

pub fn send_auth(email: String, password: String) -> Effect(Msg) {
  let payload =
    json.object([
      #("email", json.string(email)),
      #("password", json.string(password)),
    ])

  lustre_http.post(
    env.post_signup,
    payload,
    lustre_http.expect_anything(GotResponseAuth),
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
            element.text("Authentication form: "),
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
