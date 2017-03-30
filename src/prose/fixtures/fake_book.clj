(ns prose.fixtures.fake-book
  (:require [prose.models.user :as user]
            [prose.models.apu :as apu]
            [prose.models.book :as book]
            [prose.models.chapter :as chapter]
            [prose.models.paragraph :as paragraph]))

(def lorem "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")

(defn fake-chapter
  [size]
  (repeat size lorem))

(defn create-fake-book
  []
  (let
    [fake-user (user/token-registration "Fakey McFakerton")
     fake-book (book/create {:book_title "Fake Book"
                             :user_id (:id fake-user)
                             :chapter_title "Sup"
                             :content lorem})
     fake-initial-chapter-id (:id (first (:contents fake-book)))
     fake-initial-chapter-ending-id (reduce
                                     (fn
                                       [previous-id next-content]
                                       (:id
                                        (first
                                         (:contents
                                          (paragraph/create
                                           {:parent_id previous-id
                                            :user_id (:id fake-user)
                                            :content next-content})))))
                                     fake-initial-chapter-id
                                     (fake-chapter 199))
     fake-following-chapters (reduce
                              (fn
                                [previous-chapter-ending-id next-chapter]
                                (let
                                  [chapter-start-id
                                   (:id
                                    (first
                                     (:contents
                                      (chapter/create
                                       {:parent_id previous-chapter-ending-id
                                        :user_id (:id fake-user)
                                        :title "Sup"
                                        :content (first next-chapter)}))))]
                                  (reduce
                                   (fn
                                     [previous-id next-content]
                                     (:id
                                      (first
                                       (:contents
                                        (paragraph/create
                                         {:parent_id previous-id
                                          :user_id (:id fake-user)
                                          :content next-content})))))
                                   chapter-start-id
                                   (rest next-chapter))))
                              fake-initial-chapter-ending-id
                              (repeat 5 (fake-chapter 200)))]
    (:id fake-book)))

#_(create-fake-book)


