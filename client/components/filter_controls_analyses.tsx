import {
  CheckIcon,
  FilterIcon,
  MinusIcon,
  PencilAltIcon,
  PencilIcon,
  PlusIcon,
  SelectorIcon,
  XIcon,
} from "@heroicons/react/outline";
import { useState } from "react";
import { UseAnalyses } from "../hooks/use_analyses";
import { UseTopics } from "../hooks/use_topics";
import { UseUI } from "../hooks/use_ui";
import { Topic } from "../types";
import { TopicEditor } from "./topic_editor";
import { UIColor, UIIconButton, UIInput } from "./ui";

type FilterControlsAnalysesProps = {
  canEdit: boolean;
  uui: UseUI;
  ua: UseAnalyses;
  ut: UseTopics;
  nTotal: number;
  nFiltered: number;
};

export const FilterControlsAnalyses: React.FC<FilterControlsAnalysesProps> = (
  p
) => {
  const [topicEditorIsOpen, setTopicEditorIsOpen] = useState<
    Topic | "new" | undefined
  >(undefined);

  return (
    <div className="px-4 py-4 text-sm">
      {p.nFiltered === p.nTotal ? (
        <div className="">Showing all {p.nTotal} analyses</div>
      ) : (
        <div className="font-bold text-purple-600">
          Showing {p.nFiltered} of {p.nTotal} analyses
        </div>
      )}
      <div className="mt-4 font-bold">Search</div>
      <div className="flex items-center mt-1">
        <div className="flex-1">
          <UIInput
            value={p.uui.searchText}
            onChange={(v) => p.uui.updateSearchText(v)}
            purple
          />
        </div>
        {p.uui.searchText !== "" && (
          <span className="flex-none ml-2">
            <UIIconButton
              icon={XIcon}
              onClick={p.uui.clearSearchText}
              color={UIColor.Purple}
            />
          </span>
        )}
      </div>
      <div className="mt-4 font-bold">Topics</div>
      {p.ut.topics.map((topic) => {
        return (
          <TagItem
            key={topic.id}
            label={topic.label}
            onClick={() => p.uui.toggleTopic(topic.id)}
            checked={p.uui.selectedTopic === topic.id}
            edit={p.canEdit ? () => setTopicEditorIsOpen(topic) : undefined}
          />
        );
      })}
      {p.canEdit && (
        <span
          className="inline-block mt-1 ui-link"
          onClick={() => setTopicEditorIsOpen("new")}
        >
          New topic
        </span>
      )}
      {p.ua.tags.length > 0 && (
        <>
          <div className="mt-4 font-bold">Tags</div>
          {p.ua.tags.map((tag) => {
            return (
              <TagItem
                key={tag}
                label={tag}
                onClick={() => p.uui.toggleTag(tag)}
                checked={p.uui.selectedTags.includes(tag)}
              />
            );
          })}
        </>
      )}

      {topicEditorIsOpen === "new" && (
        <TopicEditor
          cancel={() => setTopicEditorIsOpen(undefined)}
          isNewTopic={true}
          initialLabel={""}
          topics={p.ut.topics}
          refreshTopics={p.ut.refreshTopics}
        />
      )}

      {topicEditorIsOpen && topicEditorIsOpen !== "new" && (
        <TopicEditor
          cancel={() => setTopicEditorIsOpen(undefined)}
          isNewTopic={false}
          id={topicEditorIsOpen.id}
          initialLabel={topicEditorIsOpen.label}
          topics={p.ut.topics}
          refreshTopics={p.ut.refreshTopics}
        />
      )}
    </div>
  );
};

type TagItemProps = {
  label: string;
  onClick: () => void;
  edit?: () => void;
  checked: boolean;
};

export const TagItem: React.FC<TagItemProps> = (p) => {
  return (
    <div className="flex items-center h-6 mt-1 group">
      <div
        className={`flex-1 mr-1 truncate text-sm group-hover:font-bold cursor-pointer ${
          p.checked ? "text-purple-600 font-bold" : ""
        }`}
        onClick={p.onClick}
      >
        {p.label}
      </div>
      {p.edit && (
        <div
          className={`flex-none p-0.5 mr-1 ui-btn-lightgray hidden group-hover:inline-block`}
          onClick={p.edit}
        >
          <PencilAltIcon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`flex-none p-0.5 ${
          p.checked ? "ui-btn-purple" : "ui-btn-lightgray"
        }`}
        onClick={p.onClick}
      >
        {p.checked ? (
          <MinusIcon className="w-5 h-5" />
        ) : (
          <PlusIcon className="w-5 h-5" />
        )}
      </div>
    </div>
  );
};
