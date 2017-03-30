(ns prose.routes
  (:require [prose.auth :as auth]
            [prose.hiccups :as hiccups]
            [compojure.core :refer :all]
            [compojure.route :as cr]
            [compojure.handler :as ch]
            [ring.middleware.json :as rj]
            [ring.util.response :refer [response]]
            [prose.models.apu :as apu]
            [prose.models.user :as user]
            [prose.models.chapter :as chapter]
            [prose.models.book :as book]
            [prose.models.paragraph :as paragraph]
            [cemerick.friend :as friend]))

;API Routes

(defroutes json-open-routes
  (GET "/start/apu/:id" [id]
       (response (apu/start-apu {:location_id id})))
  (GET "/start/book/:id" [id]
       (response (apu/start-book {:book_id id})))
  (GET "/discover/:id" [id]
       (response (apu/forward-discovery {:parent_id id})))
  (GET "/range/children/:parent/:child" [parent child]
       (response (apu/forward-range {:parent_id parent :child_id child})))
  (GET "/range/parents/:parent/:child" [parent child]
       (response (apu/previous-range {:parent_id parent :child_id child})))
  (GET "/chapters/:id" [id]
       (response (apu/previous-chapters {:location_id id}))))

(defroutes json-closed-routes
  (POST "/chapter" {body :body}
        (response (chapter/create body)))
  (POST "/paragraph" {body :body}
        (response (paragraph/create body)))
  (POST "/book" {body :body}
        (response (book/create body))))

(defroutes json-all-routes
  json-open-routes
  json-closed-routes)

(defroutes api-routes
  (context "/api" [] json-all-routes))

;HTML Routes

(defroutes html-routes
  (GET "/" request
       (hiccups/default-home request))
  (GET "/login" request
       (hiccups/login-form))
  (GET "/signup" request
       (hiccups/signup-form))
  (GET "/token/new" request
       (hiccups/token-signup-form))
  (GET "/token/:token" [token]
       (hiccups/token-login-form token)))

(defroutes locked-routes
  (GET "/protected" []
       (friend/authorize #{::user} "This page can only be seen by authenticated users.")))

;Defaults

(defroutes default-routes
  (cr/resources "/")
  (cr/not-found "Not Found"))

;Combined Handler

(defroutes all-routes
  (rj/wrap-json-body (rj/wrap-json-response api-routes))
  html-routes
  locked-routes
  default-routes)
