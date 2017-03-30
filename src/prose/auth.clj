(ns prose.auth
  (:require [prose.models.user :as user]
            [ring.util.request :as req]
            [ring.util.response :as res]
            [cemerick.friend :as friend]
            [cemerick.friend.util :refer [gets]]
            (cemerick.friend [workflows :as workflows]
                             [credentials :as creds])))

(defn- token-as-identity
  [user-record]
  (if (:identity user-record)
    user-record
    (assoc user-record :identity (:token user-record))))

(defn make-auth
  [user-record auth-meta]
  (vary-meta (token-as-identity user-record) merge {:type ::friend/auth} auth-meta))

(defn token-form
  [& {:keys [login-uri credential-fn] :as config}]
  (fn [request]
    (when
      (and
       (= login-uri (req/path-info request))
       (= :post (:request-method request)))
      (if-let
        [user-record (credential-fn (:token (:params request)))]
        (make-auth user-record {::friend/workflow :token-auth
                                ::friend/redirect-on-auth? true})
        (assoc
          (res/redirect (str "/token/" (:token (:params request))))
          :flash {:problems {:token "This token is invalid."}})))))

(defn token-signup
  [& {:keys [login-uri credential-fn] :as config}]
  (fn [request]
    (when
      (and
       (= login-uri (req/path-info request))
       (= :post (:request-method request)))
      (if-let
        [user-record (credential-fn (:name (:params request)))]
        (if (:problems user-record)
          (assoc (res/redirect (:login-uri config)) :flash user-record)
          (res/redirect (str "/token/" (:token user-record))))))))

(defn friend-middleware
  "Returns a middleware that enables authentication via Friend."
  [handler]
  (let
    [friend-m {:workflows
               [(token-form
                 :login-uri "/token"
                 :credential-fn user/token-auth)
                (token-signup
                 :login-uri "/token/new"
                 :credential-fn user/token-registration)
                (workflows/interactive-form
                 :login-uri "/login"
                 :credential-fn (partial creds/bcrypt-credential-fn user/password-auth))]}]
    (-> handler
        (friend/authenticate friend-m))))

#_(def example-session-from-ring-request
    {:session
     {:cemerick.friend/identity
      {:current "jane"
       :authentications {"jane"
                         {:identity "jane"
                          :username "jane"
                          :roles #{:prose.core/user}}}}}})

(defn extract-session
  "Takes a Ring request map, extracts a map with current session data, or returns nil."
  [request]
  (let
    [request-session (:session request)
     session-map (:cemerick.friend/identity request-session)
     current-key (:current session-map)
     authentications (:authentications session-map)
     current-session (get authentications current-key)]
    (dissoc current-session :identity :token)))

