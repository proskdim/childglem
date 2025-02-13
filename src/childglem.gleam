import auth/jwt
import auth/signin
import auth/signup
import gleam/io
import gleam/result
import gleam/string
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/button
import plinth/browser/window

pub type Msg =
  Pages

pub type Router {
  Router(page: Pages)
}

pub type Pages {
  AuthSignup
  AuthSignin
  AuthLogout
}

pub fn main() {
  let _ = lustre.register(signup.app(), "my-signup")
  let _ = lustre.register(signin.app(), "my-signin")

  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", 0)
}

pub fn init(_flags) -> #(Router, Effect(Msg)) {
  #(Router(page: AuthSignup), effect.none())
}

pub fn update(_router: Router, msg: Msg) -> #(Router, Effect(Msg)) {
  case msg {
    AuthSignup -> #(Router(page: AuthSignup), effect.none())
    AuthSignin -> #(Router(page: AuthSignin), effect.none())
    AuthLogout -> {
      let _ = jwt.delete()
      #(Router(page: AuthSignin), effect.none())
    }
  }
}

pub fn view(router: Router) -> Element(Msg) {
  let button_style = [
    #("display", "flex"),
    #("gap", "10px"),
    #("justify-content", "end"),
    #("margin", "15px"),
  ]

  let container_style = [#("width", "80%"), #("margin", "auto")]

  let token = result.unwrap(jwt.fetch(), "")

  html.div([attribute.style(container_style)], [
    html.div([], [
      case string.length(token) <= 1 {
        True -> {
          html.div([attribute.style(button_style)], [
            ui.button([button.greyscale(), event.on_click(AuthSignup)], [
              element.text("signup"),
            ]),
            ui.button([button.greyscale(), event.on_click(AuthSignin)], [
              element.text("signin"),
            ]),
          ])
        }
        False -> {
          html.div([attribute.style(button_style)], [
            ui.button([button.primary(), event.on_click(AuthLogout)], [
              element.text("logout"),
            ]),
          ])
        }
      },
      case string.length(token) <= 1 {
        True -> {
          case router.page {
            AuthSignup -> html.div([], [element("my-signup", [], [])])
            AuthSignin -> html.div([], [element("my-signin", [], [])])
            AuthLogout -> html.div([], [element("my-signin", [], [])])
          }
        }

        False -> {
          html.div([], [
           element.text("table")
          ])
        }
      },
    ]),
  ])
}
