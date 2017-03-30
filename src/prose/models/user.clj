(ns prose.models.user
  (:require [prose.utilities :refer :all]
            [prose.validation :refer :all]
            [prose.modeler :refer :all]
            [noir.validation :as vali]
            [cemerick.friend.credentials :as creds]))

;Support Functions

(defn anonymize-if-needed
  "Upon user creation, supplies an anonymous name to input if needed."
  [params]
  (if (nil? (:name params))
    (merge params {:name "Anonymous Prosebot"})
    params))

(defn hash-local-password
  "Uses BCrypt to hash any passwords in input, before submission to the database."
  [params]
  (merge params {:password (creds/hash-bcrypt (:password params) :work-factor 10)}))

(defn uuid
  []
  (str (java.util.UUID/randomUUID)))

;Queries

(defquery change-name
  {:filename "cypher/user/change_name.cypher"
   :limit 1
   :input (fn [params]
            (anonymize-if-needed params))})

(defquery create
  {:filename "cypher/user/create.cypher"
   :limit 1
   :ids 1
   :input (fn [params]
            (anonymize-if-needed params))})

(defquery find-by-id
  {:filename "cypher/user/find_by_id.cypher"
   :limit 1})

(defquery local-find-by-username
   {:filename "cypher/user/local_find_by_username.cypher"
    :limit 1})

(defquery local-add
  {:filename "cypher/user/local_add.cypher"
   :limit 1
   :input (fn [params]
            (hash-local-password params))})

(defquery local-authenticate
  {:filename "cypher/user/local_authenticate.cypher"
   :limit 1
   :input (fn [params]
            (dissoc params :password))
   :output (fn [result input params] result)})

(defquery local-create
  {:filename "cypher/user/local_create.cypher"
   :limit 1
   :ids 1
   :input (fn [params]
            (hash-local-password params))
   :validation (fn [input params]
                 (validator
                  (rules-for :name
                             (rule
                              (vali/has-value? (:name input))
                              "Your psudeonym is needed."))
                  (rules-for :username
                             (rule
                              (vali/has-value? (:username input))
                              "Your username is needed."))
                  (rules-for :username
                             (rule
                              (not (local-find-by-username {:username (:username input)}))
                              "Your username is already taken. Please choose another."))
                  (rules-for :password
                             (rule (vali/has-value? (:password params)) "Your password is needed."))))})

(defquery token-find
  {:filename "cypher/user/token_find.cypher"
   :limit 1})

(defquery token-add
  {:filename "cypher/user/token_add.cypher"
   :limit 1
   :input (fn [params]
            (merge params {:token (uuid)}))})

(defquery token-authenticate
  {:filename "cypher/user/token_find.cypher"
   :limit 1})

(defquery token-create
  {:filename "cypher/user/token_create.cypher"
   :limit 1
   :ids 1
   :input (fn [params]
            (merge params {:token (uuid)}))
   :validation (fn [input params]
                 (validator
                  (rules-for :name
                             (rule
                              (vali/has-value? (:name input))
                              "Your psudeonym is needed."))))})

;Consumables

(defn password-auth
  [username]
  (local-authenticate {:username username}))

(defn token-auth
  [token]
  (token-authenticate {:token token}))

(defn token-registration
  [name]
  (token-create {:name name}))

;Examples

#_(password-auth "jdjensen")
#_(local-authenticate {:username "jdjensen"})
#_(local-find-by-username {:username "jdjensen"})
#_(create {:name "Jon D. J."})
#_(local-add {:user_id "OiNq4" :username "jdjensen" :password "pass0202"})
#_(change-name {:name "No longer anon" :id "SU4J3"})
#_(local-create {:name "JDJ" :username "jdjo" :password ""})
#_(token-add {:user_id "OiNq4"})
#_(token-authenticate {:token "5530f90c-7f68-4ff3-bfac-b066e6a27c9d"})
#_(token-create {:name "Token J."})
#_(token-auth "5530f90c-7f68-4ff3-bfac-b066e6a27c9d")

