(ns prose.hiccups
  (:require [prose.auth :as auth]
            [hiccup.core :as h]
            [hiccup.page :refer [html5]]
            [clojure.data.json :as j]
            [prose.models.apu :as apu]
            [prose.models.user :as user]
            [prose.models.chapter :as chapter]
            [prose.models.book :as book]
            [prose.models.paragraph :as paragraph]))

(defn login-form
  []
  (html5
   {:lang "en"}
   [:head
    [:title "Login"]]
   [:body
    [:form {:method "POST" :action "login" :class "login"}
     [:div
      [:label "Username"]
      [:input {:type "text" :name "username"}]]
     [:div
      [:label "Password"]
      [:input {:type "password" :name "password"}]]
     [:div
      [:input {:type "submit" :class "button" :value "Login"}]]]]))

(defn signup-form
  []
  (html5
   {:lang "en"}
   [:head
    [:title "Sign Up"]]
   [:body
    [:form {:method "POST" :action "signup" :class "login"}
     [:div
      [:label "Username"]
      [:input {:type "text" :name "username"}]]
     [:div
      [:label "Password"]
      [:input {:type "password" :name "password"}]]
     [:h2 "Choose your psuedonym carefully. Everyone will see it."]
     [:div
      [:label "Psuedonym"]
      [:input {:type "text" :name "name"}]]
     [:div
      [:input {:type "submit" :class "button" :value "Login"}]]]]))

(defn token-login-form
  [token]
  (let
    [user (user/token-auth token)]
    (html5
     {:lang "en"}
     [:head
      [:title "Sign in"]
      [:script {:type "text/javascript" :src "/js/gfonts.js"}]
      [:link {:type "text/css" :rel "stylesheet" :href "/css/test1.css"}]]
     [:body
      [:div.page.full.login
       [:div.empty_page_header]
       [:div.page_content
        [:h4 "On Signing"]
        (if user
          [:div
           [:p "Welcome to the site, " [:strong (:name user)] "."]
           [:p "This is your very own signature page."]
           [:p "Use this page to sign in. Bookmark it for later."]]
          [:p "This token is invalid."])
          [:p "Signature: "[:em token]]
        [:form {:method "POST" :action "/token" :class "login"}
         [:input {:type "hidden" :name "token" :value token}]
         [:div
          [:input {:type "submit" :class "button" :value "Sign in"}]]]]
       [:div.page_footer
        [:div.page_nav
         [:ul.nav
          [:li "∞"]]]]]])))

(defn token-signup-form
  []
  (html5
   {:lang "en"}
   [:head
    [:title "Sign Up"]]
   [:body
    [:form {:method "POST" :action "/token/new" :class "login"}
     [:div
      [:label "Psuedonym"]
      [:input {:type "text" :name "name"}]]
     [:div
      [:input {:type "submit" :class "button" :value "Sign Up"}]]]]))

(defn default-home
  [request]
  (html5
   {:lang "en"}
   [:head
    [:meta {:charset "utf-8"}]
    [:meta {:http-equiv "X-UA-Compatible" :content "IE=Edge"}]
    [:title "Prose"]
    [:script {:type "application/json" :id "init"} (j/write-str (auth/extract-session request))]
    [:script {:type "text/javascript" :src "/js/gfonts.js"}]
    [:script {:type "text/javascript" :src "/js/jquery-2.0.3.min.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/moment/moment.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/atomic/dist/atomic.min.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/rsvp/rsvp.min.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/underscore/underscore.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/react/react.min.js"}]
    [:script {:type "text/javascript" :src "/js/bower_components/react/JSXTransformer.js"}]
    [:script {:type "text/jsx" :src "/js/src/test.js"}]
    [:link {:type "text/css" :rel "stylesheet" :href "/css/test1.css"}]]
   [:body
    [:div#content]]))
