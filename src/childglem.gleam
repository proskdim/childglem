import auth/signin
import auth/signup
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element, element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/button

pub type Msg =
  Pages

pub type Router {
  Router(page: Pages)
}

pub type Pages {
  AuthSignup
  AuthSignin
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
  }
}

pub fn view(router: Router) -> Element(Msg) {
  let main_page_style = [
    #("display", "flex"),
    #("gap", "10px"),
    #("justify-content", "end"),
    #("margin", "15px"),
  ]

  let container_style = [#("width", "80%"), #("margin", "auto")]

  html.div([attribute.style(container_style)], [
    html.div([attribute.style(main_page_style)], [
      ui.button([button.greyscale(), event.on_click(AuthSignup)], [
        element.text("signup"),
      ]),
      ui.button([button.greyscale(), event.on_click(AuthSignin)], [
        element.text("signin"),
      ]),
    ]),
    case router.page {
      AuthSignup -> html.div([], [element("my-signup", [], [])])
      AuthSignin -> html.div([], [element("my-signin", [], [])])
    },
  ])
}
