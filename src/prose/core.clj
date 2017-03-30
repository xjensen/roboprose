(ns prose.core
  (:require [prose.auth :as auth]
            [prose.routes :as routes]
            [prose.middleware :as mw]
            [compojure.handler :as ch]
            [ring.adapter.jetty :as ring]
            [ring.middleware.reload :as rr]))

(def app
  (-> routes/all-routes
      (mw/print-rings)
      (auth/friend-middleware)
      (rr/wrap-reload)
      (ch/site)))

(defn start [port]
  (ring/run-jetty app {:port port :join? false}))

(defn -main []
  (let [port (Integer/parseInt (or (System/getenv "PORT") "8080"))]
    (start port)))
