(ns prose.validation)

(defn rule
  "Test the rule. If fails, deliver the error message."
  [test-case error-message]
  (if-not test-case error-message))

(defn rules-for
  "Collect and evaluate rules under a keyword."
  [group-keyword & rules]
  (let
    [error-messages (remove nil? rules)]
    (if-not (empty? error-messages) {group-keyword error-messages})))

(defn validator
  "Collect rules-for groups and evaluate all at once."
  [& rule-groups]
  (let
    [error-groups (remove nil? rule-groups)]
    (if-not (empty? error-groups)
      {:problems (apply merge error-groups)})))



;Examples

#_(rule (= 1 2) "unequal")

#_(rules-for
   :whatever
   (rule (= 1 1) "unequal")
   (rule (= 1 1) "more unequal"))

#_(validator
   (rules-for
    :whatever
    (rule (= 3 1) "unequal")
    (rule (= 1 2) "more unequal"))
   (rules-for
    :whatever
    (rule (= 1 2) "unequaler")
    (rule (= 1 1) "unequalest")))
