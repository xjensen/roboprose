(ns prose.fixtures.fake-book
  (:require [prose.models.user :as user]
            [prose.models.apu :as apu]
            [prose.models.book :as book]
            [prose.models.chapter :as chapter]
            [prose.models.paragraph :as paragraph]
            [prose.utilities :refer :all]
            [clojure.data.json :as j]))

(def data (j/read-str (read-resource "public/data/invisibleman.json")))

(defn create-fake-book
  []
  (let
    [fake-user (user/token-registration "H. G. Wells")
     fake-book (book/create {:book_title (data "title")
                             :user_id (:id fake-user)
                             :chapter_title ((first (data "chapters")) "heading")
                             :content ((first ((first (data "chapters")) "paragraphs")) "content")})
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
                                            :content (next-content "content")})))))
                                     fake-initial-chapter-id
                                     (drop 1 ((first (data "chapters")) "paragraphs")))
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
                                        :title (next-chapter "heading")
                                        :content ((first (next-chapter "paragraphs")) "content")}))))]
                                  (reduce
                                   (fn
                                     [previous-id next-content]
                                     (:id
                                      (first
                                       (:contents
                                        (paragraph/create
                                         {:parent_id previous-id
                                          :user_id (:id fake-user)
                                          :content (next-content "content")})))))
                                   chapter-start-id
                                   (rest (next-chapter "paragraphs")))))
                              fake-initial-chapter-ending-id
                              (drop 1 (data "chapters")))]
    (:id fake-book)))

#_(create-fake-book)
