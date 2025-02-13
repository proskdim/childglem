import env
import gleam/http/response.{type Response}
import gleam/json
import gleam/option.{type Option, None, Some}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import rsvp

const http_200 = "success authentication"

const http_fail = "failed authentication"

pub type Auth {
  Auth(email: String, password: String, response: Option(String))
}

pub type Msg {
  Init
  EmailUpdateInput(value: String)
  PasswordUpdateInput(value: String)

  CreateUser
  ApiAuthPost(Result(Response(String), rsvp.Error))
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

    CreateUser -> {
      #(model, create_user(model.email, model.password))
    }

    ApiAuthPost(Ok(_)) -> {
      #(Auth(..model, response: Some(http_200)), effect.none())
    }

    ApiAuthPost(Error(_)) -> {
      #(Auth(..model, response: Some(http_fail)), effect.none())
    }
  }
}

pub fn create_user(email: String, password: String) -> Effect(Msg) {
  let body =
    json.object([
      #("email", json.string(email)),
      #("password", json.string(password)),
    ])

  let handler = rsvp.expect_ok_response(ApiAuthPost)
  rsvp.post(env.post_signup, body, handler)
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
            ui.button([event.on_click(CreateUser)], [element.text("Send")]),
          ),
        ),
      ),
    ),
  ])
}
