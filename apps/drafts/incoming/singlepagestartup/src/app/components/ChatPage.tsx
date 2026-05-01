import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Pin,
  Users,
  Send,
  MessageSquare,
  ChevronLeft,
  Search,
  Smile,
  MoreHorizontal,
  Plus,
  Paperclip,
  X,
  GripVertical,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Edit3,
  Trash2,
  Check,
  UserPlus,
  UserMinus,
  Settings,
} from "lucide-react";
import {
  chatGroups,
  chatUsers,
  getUserById,
  type ChatGroup,
  type ChatThread,
  type ChatMessage,
} from "../chatData";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "./AuthContext";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useEscapeStack } from "../hooks/useEscapeStack";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface AttachedFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatMessageTime(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday " + format(d, "HH:mm");
  return format(d, "MMM d, HH:mm");
}

function formatThreadDate(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
  if (type.includes("pdf") || type.includes("document"))
    return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

/* ─── Draggable File Item ──────────────────────────────────────────────── */

const FILE_DND_TYPE = "ATTACHED_FILE";

function DraggableFileItem({
  item,
  index,
  onRemove,
  onMove,
}: {
  item: AttachedFile;
  index: number;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: FILE_DND_TYPE,
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: FILE_DND_TYPE,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index === index) return;
      onMove(draggedItem.index, index);
      draggedItem.index = index;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  drag(drop(ref));

  const isImage = item.file.type.startsWith("image/");

  return (
    <div
      ref={ref}
      className={`group flex items-center gap-2 rounded-lg border bg-white px-2 py-1.5 transition ${
        isDragging
          ? "border-slate-400 opacity-50"
          : isOver
            ? "border-slate-300 bg-slate-50"
            : "border-slate-200"
      }`}
      style={{ cursor: "grab" }}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
      {isImage && item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="h-8 w-8 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
          {getFileIcon(item.file.type)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-700">{item.file.name}</p>
        <p className="text-[10px] text-slate-400">
          {formatFileSize(item.file.size)}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-300 transition hover:bg-red-50 hover:text-red-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── GroupList (left column) ────────────────────────────────────────── */

function GroupList({
  groups,
  activeGroupId,
  onSelectGroup,
  unreadCounts,
}: {
  groups: ChatGroup[];
  activeGroupId: string;
  onSelectGroup: (id: string) => void;
  unreadCounts: Record<string, number>;
}) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm text-slate-900">Chats</h2>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {groups.map((g) => {
          const isActive = g.id === activeGroupId;
          const groupUnread = g.threads.reduce(
            (sum, t) => sum + (unreadCounts[t.id] || 0),
            0,
          );
          return (
            <button
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base">
                {isActive ? (
                  <span>{g.icon}</span>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/70 text-base">
                    {g.icon}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`truncate text-sm ${
                      isActive ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {g.name}
                  </span>
                  {groupUnread > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] tabular-nums text-white">
                      {groupUnread}
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-xs ${
                    isActive ? "text-white/50" : "text-slate-400"
                  }`}
                >
                  {g.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ThreadList (middle column) ─────────────────────────────────────── */

function ThreadList({
  group,
  activeThreadId,
  onSelectThread,
  onBack,
  unreadCounts,
  onUpdateGroup,
  onUpdateThread,
  onAddThread,
  onAddMember,
  onRemoveMember,
}: {
  group: ChatGroup;
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onBack: () => void;
  unreadCounts: Record<string, number>;
  onUpdateGroup: (
    groupId: string,
    updates: Partial<Pick<ChatGroup, "name" | "description" | "icon">>,
  ) => void;
  onUpdateThread: (
    groupId: string,
    threadId: string,
    updates: Partial<Pick<ChatThread, "title" | "pinned">>,
  ) => void;
  onAddThread: (groupId: string, title: string) => void;
  onAddMember: (groupId: string, userId: string) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "general" | "threads" | "members"
  >("general");

  useEscapeStack(showSettings, () => setShowSettings(false));
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description);
  const [editIcon, setEditIcon] = useState(group.icon);

  // Thread editing
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [threadMenuId, setThreadMenuId] = useState<string | null>(null);
  const threadMenuRef = useRef<HTMLDivElement>(null);
  const [memberSearch, setMemberSearch] = useState("");

  // Available users not in group
  const nonMembers = useMemo(
    () => chatUsers.filter((u) => !group.memberIds.includes(u.id)),
    [group.memberIds],
  );

  // Reset form when group changes
  useEffect(() => {
    setEditName(group.name);
    setEditDesc(group.description);
    setEditIcon(group.icon);
    setShowSettings(false);
    setSettingsTab("general");
    setEditingThreadId(null);
    setThreadMenuId(null);
    setMemberSearch("");
  }, [group.id]);

  // Close thread context menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        threadMenuRef.current &&
        !threadMenuRef.current.contains(e.target as Node)
      ) {
        setThreadMenuId(null);
      }
    }
    if (threadMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [threadMenuId]);

  const handleSaveGroup = () => {
    if (!editName.trim()) return;
    onUpdateGroup(group.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      icon: editIcon,
    });
  };

  const handleSaveThread = () => {
    if (!editingThreadId || !editThreadTitle.trim()) return;
    onUpdateThread(group.id, editingThreadId, {
      title: editThreadTitle.trim(),
    });
    setEditingThreadId(null);
  };

  const handleTogglePin = (threadId: string, currentPinned?: boolean) => {
    onUpdateThread(group.id, threadId, { pinned: !currentPinned });
    setThreadMenuId(null);
  };

  const sortedThreads = useMemo(() => {
    const filtered = search
      ? group.threads.filter((t) =>
          t.title.toLowerCase().includes(search.toLowerCase()),
        )
      : group.threads;

    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });
  }, [group.threads, search]);

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base">{group.icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm text-slate-900">{group.name}</h2>
          <p className="text-[11px] text-slate-400">
            {group.memberIds.length} members &middot; {group.threads.length}{" "}
            threads
          </p>
        </div>
        <button
          onClick={() => {
            setEditName(group.name);
            setEditDesc(group.description);
            setEditIcon(group.icon);
            setSettingsTab("general");
            setShowSettings(true);
          }}
          title="Chat settings"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Settings modal (group + threads + members) */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="mx-4 flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{group.icon}</span>
                <h3 className="text-sm text-slate-900">{group.name}</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 border-b border-slate-200">
              {[
                { key: "general" as const, label: "General" },
                {
                  key: "threads" as const,
                  label: `Threads (${group.threads.length})`,
                },
                {
                  key: "members" as const,
                  label: `Members (${group.memberIds.length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSettingsTab(tab.key)}
                  className={`flex-1 px-3 py-2.5 text-xs transition ${
                    settingsTab === tab.key
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {/* General tab */}
              {settingsTab === "general" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        Icon
                      </label>
                      <input
                        type="text"
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-14 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-lg outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] text-slate-500">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">
                      Description
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveGroup}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-800"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}

              {/* Threads tab */}
              {settingsTab === "threads" && (
                <div className="space-y-3">
                  {/* Add new thread */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newThreadTitle.trim()) {
                          onAddThread(group.id, newThreadTitle.trim());
                          setNewThreadTitle("");
                        }
                      }}
                      placeholder="New thread name..."
                      className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                    <button
                      onClick={() => {
                        if (newThreadTitle.trim()) {
                          onAddThread(group.id, newThreadTitle.trim());
                          setNewThreadTitle("");
                        }
                      }}
                      disabled={!newThreadTitle.trim()}
                      className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-[11px] text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>

                  {/* Thread list */}
                  <div className="space-y-1">
                    {group.threads.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        No threads yet
                      </p>
                    ) : (
                      group.threads.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {t.pinned && (
                                <Pin className="h-3 w-3 shrink-0 text-amber-500" />
                              )}
                              <p className="truncate text-xs text-slate-700">
                                {t.title}
                              </p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {t.messages.length} messages &middot;{" "}
                              {formatThreadDate(t.lastActivity)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => handleTogglePin(t.id, t.pinned)}
                              title={t.pinned ? "Unpin" : "Pin"}
                              className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-slate-100 ${t.pinned ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}
                            >
                              <Pin className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditThreadTitle(t.title);
                                setEditingThreadId(t.id);
                              }}
                              title="Edit thread"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Members tab */}
              {settingsTab === "members" && (
                <div className="space-y-3">
                  {/* Search members */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
                    />
                    {memberSearch && (
                      <button
                        onClick={() => setMemberSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Current members */}
                  <div>
                    <h4 className="mb-1.5 text-[11px] text-slate-400">
                      Members ({group.memberIds.length})
                    </h4>
                    <div className="space-y-1">
                      {group.memberIds
                        .map((uid) => getUserById(uid))
                        .filter(
                          (u) =>
                            !memberSearch.trim() ||
                            u.name
                              .toLowerCase()
                              .includes(memberSearch.trim().toLowerCase()) ||
                            u.role
                              .toLowerCase()
                              .includes(memberSearch.trim().toLowerCase()),
                        )
                        .map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                          >
                            <ImageWithFallback
                              src={u.avatar}
                              alt={u.name}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-slate-700">
                                {u.name}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {u.role}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {u.online && (
                                <span className="h-2 w-2 rounded-full bg-green-400" />
                              )}
                              {group.memberIds.length > 1 && (
                                <button
                                  onClick={() => onRemoveMember(group.id, u.id)}
                                  title="Remove member"
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      {group.memberIds
                        .map((uid) => getUserById(uid))
                        .filter(
                          (u) =>
                            memberSearch.trim() &&
                            (u.name
                              .toLowerCase()
                              .includes(memberSearch.trim().toLowerCase()) ||
                              u.role
                                .toLowerCase()
                                .includes(memberSearch.trim().toLowerCase())),
                        ).length === 0 &&
                        memberSearch.trim() && (
                          <p className="py-2 text-center text-[10px] text-slate-400">
                            No matching members
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Add members */}
                  {(() => {
                    const filtered = nonMembers.filter(
                      (u) =>
                        !memberSearch.trim() ||
                        u.name
                          .toLowerCase()
                          .includes(memberSearch.trim().toLowerCase()) ||
                        u.role
                          .toLowerCase()
                          .includes(memberSearch.trim().toLowerCase()),
                    );
                    if (
                      filtered.length === 0 &&
                      !memberSearch.trim() &&
                      nonMembers.length === 0
                    )
                      return null;
                    return (
                      <>
                        <div className="border-t border-slate-200" />
                        <div>
                          <h4 className="mb-1.5 text-[11px] text-slate-400">
                            Add members
                          </h4>
                          <div className="space-y-1">
                            {filtered.length > 0 ? (
                              filtered.map((u) => (
                                <div
                                  key={u.id}
                                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                                >
                                  <ImageWithFallback
                                    src={u.avatar}
                                    alt={u.name}
                                    className="h-7 w-7 rounded-full object-cover opacity-60"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs text-slate-500">
                                      {u.name}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-400">
                                      {u.role}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => onAddMember(group.id, u.id)}
                                    title="Add member"
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-green-50 hover:text-green-600"
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="py-2 text-center text-[10px] text-slate-400">
                                {memberSearch.trim()
                                  ? "No matching users to add"
                                  : "All users are members"}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thread edit modal */}
      {editingThreadId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setEditingThreadId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-slate-900">Edit Thread</h3>
              <button
                onClick={() => setEditingThreadId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">
                Title
              </label>
              <input
                type="text"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveThread();
                }}
                autoFocus
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingThreadId(null)}
                className="rounded-md px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveThread}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="shrink-0 px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sortedThreads.map((t) => {
          const isActive = t.id === activeThreadId;
          const lastMsg = t.messages[t.messages.length - 1];
          const lastUser = getUserById(lastMsg.userId);
          const unread = unreadCounts[t.id] || 0;

          return (
            <div
              key={t.id}
              className={`group/thread relative border-b border-slate-100 transition ${
                isActive ? "bg-slate-50" : "hover:bg-slate-50/50"
              }`}
            >
              <button
                onClick={() => onSelectThread(t.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {t.pinned && (
                      <Pin className="h-3 w-3 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={`text-sm ${
                        isActive ? "text-slate-900" : "text-slate-800"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unread > 0 && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] tabular-nums text-white">
                        {unread}
                      </span>
                    )}
                    <span className="text-[10px] tabular-nums text-slate-400">
                      {formatThreadDate(t.lastActivity)}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <ImageWithFallback
                    src={lastUser.avatar}
                    alt={lastUser.name}
                    className="h-4 w-4 shrink-0 aspect-square rounded-full object-cover"
                  />
                  <p className="truncate text-xs text-slate-400">
                    <span className="text-slate-500">
                      {lastUser.name.split(" ")[0]}:
                    </span>{" "}
                    {lastMsg.text.slice(0, 80)}
                    {lastMsg.text.length > 80 ? "…" : ""}
                  </p>
                </div>
              </button>

              {/* Thread context menu */}
              <div className="absolute right-2 top-2 opacity-0 group-hover/thread:opacity-100 transition-opacity">
                <div
                  className="relative"
                  ref={threadMenuId === t.id ? threadMenuRef : undefined}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setThreadMenuId(threadMenuId === t.id ? null : t.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {threadMenuId === t.id && (
                    <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditThreadTitle(t.title);
                          setEditingThreadId(t.id);
                          setThreadMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3 text-slate-400" />
                        Edit thread
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(t.id, t.pinned);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pin className="h-3 w-3 text-slate-400" />
                        {t.pinned ? "Unpin thread" : "Pin thread"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sortedThreads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No threads found</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ThreadView (right column — messages) ───────────────────────────── */

function ThreadView({
  thread,
  onBack,
  initialUnreadCount,
}: {
  thread: ChatThread;
  onBack: () => void;
  initialUnreadCount: number;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(thread.messages);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  useEscapeStack(showEmojiPicker, () => setShowEmojiPicker(false));
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Snapshot unread count when opening thread (stable across re-renders)
  const unreadSnapshotRef = useRef(initialUnreadCount);
  useEffect(() => {
    unreadSnapshotRef.current = initialUnreadCount;
  }, [thread.id, initialUnreadCount]);

  // The index where the "new messages" divider should appear
  const newMessagesDividerIdx =
    unreadSnapshotRef.current > 0
      ? thread.messages.length - unreadSnapshotRef.current
      : -1;

  // Sync when thread changes
  useEffect(() => {
    setMessages(thread.messages);
    setAttachedFiles([]);
    setShowEmojiPicker(false);
  }, [thread.id]);

  // Track whether this is the initial mount for a thread
  const isInitialScrollRef = useRef(true);

  // On thread change, reset initial scroll flag
  useEffect(() => {
    isInitialScrollRef.current = true;
  }, [thread.id]);

  // Scroll: on initial load → to divider or bottom; on new messages → bottom
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isInitialScrollRef.current) {
      isInitialScrollRef.current = false;
      // Try to scroll to the "new messages" divider
      if (newMessagesDividerIdx > 0) {
        // Use requestAnimationFrame to ensure DOM is painted
        requestAnimationFrame(() => {
          const dividerEl = container.querySelector(
            "[data-new-messages-divider]",
          );
          if (dividerEl) {
            const dividerTop = (dividerEl as HTMLElement).offsetTop;
            container.scrollTop = dividerTop - 16;
          } else {
            container.scrollTop = container.scrollHeight;
          }
        });
        return;
      }
    }
    // Default: scroll to bottom
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return;
    const fileNames = attachedFiles.map((f) => f.file.name);
    const textParts: string[] = [];
    if (newMessage.trim()) textParts.push(newMessage.trim());
    if (fileNames.length > 0)
      textParts.push(`[Attached: ${fileNames.join(", ")}]`);

    const msg: ChatMessage = {
      id: `new-${Date.now()}`,
      userId: "u1",
      text: textParts.join("\n"),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    // Revoke preview URLs
    attachedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setAttachedFiles([]);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        newMessage.slice(0, start) + emoji.native + newMessage.slice(end);
      setNewMessage(newText);
      // Restore cursor after emoji
      setTimeout(() => {
        textarea.focus();
        const newPos = start + emoji.native.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setNewMessage((prev) => prev + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setAttachedFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const creator = getUserById(thread.createdBy);

  const toggleReaction = useCallback((msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          if (reactions[idx].count <= 1) {
            reactions.splice(idx, 1);
          } else {
            reactions[idx] = {
              ...reactions[idx],
              count: reactions[idx].count - 1,
            };
          }
        } else {
          reactions.push({ emoji, count: 1 });
        }
        return {
          ...m,
          reactions: reactions.length > 0 ? reactions : undefined,
        };
      }),
    );
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {thread.pinned && (
              <Pin className="h-3 w-3 shrink-0 text-amber-500" />
            )}
            <h2 className="truncate text-sm text-slate-900">{thread.title}</h2>
          </div>
          <p className="text-[11px] text-slate-400">
            Started by {creator.name} &middot; {messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.map((msg, idx) => {
          const msgUser = getUserById(msg.userId);
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showHeader =
            !prevMsg ||
            prevMsg.userId !== msg.userId ||
            new Date(msg.timestamp).getTime() -
              new Date(prevMsg.timestamp).getTime() >
              5 * 60 * 1000;
          const showNewDivider =
            idx === newMessagesDividerIdx && newMessagesDividerIdx > 0;

          return (
            <div key={msg.id}>
              {showNewDivider && (
                <div
                  data-new-messages-divider
                  className="my-3 flex items-center gap-3"
                >
                  <div className="flex-1 border-t border-red-300" />
                  <span className="shrink-0 text-[11px] text-red-500">
                    New messages
                  </span>
                  <div className="flex-1 border-t border-red-300" />
                </div>
              )}
              <div
                className={`group/msg relative flex gap-3 rounded-lg px-2 py-1 transition hover:bg-slate-50 ${
                  showHeader ? "mt-3" : ""
                }`}
              >
                {showHeader ? (
                  <Link
                    to={`/blog/author/${msgUser.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="shrink-0"
                  >
                    <ImageWithFallback
                      src={msgUser.avatar}
                      alt={msgUser.name}
                      className="mt-0.5 h-8 w-8 rounded-full border border-slate-200 object-cover transition hover:ring-2 hover:ring-slate-300"
                    />
                  </Link>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {showHeader && (
                    <div className="flex items-baseline gap-2">
                      <Link
                        to={`/blog/author/${msgUser.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm text-slate-900 hover:underline"
                      >
                        {msgUser.name}
                      </Link>
                      <span className="text-[10px] text-slate-400">
                        {msgUser.role}
                      </span>
                      <span className="text-[10px] tabular-nums text-slate-400">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {msg.text}
                  </p>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {msg.reactions.map((r, ri) => (
                        <span
                          key={ri}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-100 cursor-pointer"
                          onClick={() => toggleReaction(msg.id, r.emoji)}
                        >
                          {r.emoji}{" "}
                          <span className="text-[10px] tabular-nums text-slate-400">
                            {r.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick reaction trigger */}
                <div className="group/react absolute bottom-0 left-10 z-10 opacity-0 transition-opacity group-hover/msg:opacity-100">
                  <button className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                  {/* Emoji tray — appears on hovering the trigger */}
                  <div className="absolute bottom-full left-0 hidden rounded-lg border border-slate-200 bg-white px-1.5 pt-1 pb-2 shadow-lg group-hover/react:flex">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-base transition hover:bg-slate-100 hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200 px-4 py-3">
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-col gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            {attachedFiles.map((item, index) => (
              <DraggableFileItem
                key={item.id}
                item={item}
                index={index}
                onRemove={removeFile}
                onMove={moveFile}
              />
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          {/* File attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.currentTarget.style.height = "auto";
                }
              }}
              placeholder="Write a message…"
              rows={1}
              style={{ maxHeight: "14rem" }}
              className="w-full resize-none overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
            />

            {/* Emoji toggle */}
            <div className="absolute right-2 top-2" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`text-slate-400 transition hover:text-slate-600 ${
                  showEmojiPicker ? "text-slate-600" : ""
                }`}
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </button>

              {/* Emoji picker popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-8 right-0 z-50">
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={1}
                    perLine={8}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() && attachedFiles.length === 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────── */

function EmptyThreadView() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <MessageSquare className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="mt-4 text-sm text-slate-500">Select a thread</h3>
      <p className="mt-1 text-xs text-slate-400">
        Choose a thread from the list to start reading
      </p>
    </div>
  );
}

/* ─── ChatPage (main) ────────────────────────────────────────────────── */

export function ChatPage() {
  const [groups, setGroups] = useState<ChatGroup[]>(() =>
    JSON.parse(JSON.stringify(chatGroups)),
  );
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<
    "groups" | "threads" | "messages"
  >("groups");

  // Unread counts per thread (mock initial data)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    t1: 5,
    t4: 1,
    t5: 3,
    t9: 1,
    t11: 2,
  });

  // The unread count snapshot when a thread was opened (for divider)
  const [openedUnread, setOpenedUnread] = useState<number>(0);

  const activeGroup = groups.find((g) => g.id === activeGroupId)!;
  const activeThread = activeThreadId
    ? (activeGroup.threads.find((t) => t.id === activeThreadId) ?? null)
    : null;

  const handleSelectGroup = (id: string) => {
    setActiveGroupId(id);
    setActiveThreadId(null);
    setMobilePanel("threads");
  };

  const handleSelectThread = (id: string) => {
    const count = unreadCounts[id] || 0;
    setOpenedUnread(count);
    setActiveThreadId(id);
    setMobilePanel("messages");
    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  /* ─── Group / Thread mutation handlers ──────────────────────────── */

  const handleUpdateGroup = useCallback(
    (
      groupId: string,
      updates: Partial<Pick<ChatGroup, "name" | "description" | "icon">>,
    ) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
      );
    },
    [],
  );

  const handleUpdateThread = useCallback(
    (
      groupId: string,
      threadId: string,
      updates: Partial<Pick<ChatThread, "title" | "pinned">>,
    ) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                threads: g.threads.map((t) =>
                  t.id === threadId ? { ...t, ...updates } : t,
                ),
              }
            : g,
        ),
      );
    },
    [],
  );

  const handleAddMember = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.memberIds.includes(userId)
          ? { ...g, memberIds: [...g.memberIds, userId] }
          : g,
      ),
    );
  }, []);

  const handleRemoveMember = useCallback((groupId: string, userId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) }
          : g,
      ),
    );
  }, []);

  const handleAddThread = useCallback((groupId: string, title: string) => {
    const now = new Date().toISOString();
    const newThread: ChatThread = {
      id: `t_${Date.now()}`,
      title,
      createdBy: "u1",
      createdAt: now,
      lastActivity: now,
      messages: [],
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, threads: [...g.threads, newThread] } : g,
      ),
    );
  }, []);

  /* height = viewport minus the sticky SiteLayout header (h-16 = 4rem) */
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Desktop 3-column layout */}
      <div className="hidden flex-1 min-h-0 overflow-hidden bg-white md:grid md:grid-cols-[256px_300px_1fr] md:grid-rows-[minmax(0,1fr)]">
        <GroupList
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={handleSelectGroup}
          unreadCounts={unreadCounts}
        />
        <ThreadList
          group={activeGroup}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onBack={() => {}}
          unreadCounts={unreadCounts}
          onUpdateGroup={handleUpdateGroup}
          onUpdateThread={handleUpdateThread}
          onAddThread={handleAddThread}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
        {activeThread ? (
          <ThreadView
            thread={activeThread}
            onBack={() => setActiveThreadId(null)}
            initialUnreadCount={openedUnread}
          />
        ) : (
          <EmptyThreadView />
        )}
      </div>

      {/* Mobile: single panel at a time */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white md:hidden">
        {mobilePanel === "groups" && (
          <GroupList
            groups={groups}
            activeGroupId={activeGroupId}
            onSelectGroup={handleSelectGroup}
            unreadCounts={unreadCounts}
          />
        )}
        {mobilePanel === "threads" && (
          <ThreadList
            group={activeGroup}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onBack={() => setMobilePanel("groups")}
            unreadCounts={unreadCounts}
            onUpdateGroup={handleUpdateGroup}
            onUpdateThread={handleUpdateThread}
            onAddThread={handleAddThread}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        )}
        {mobilePanel === "messages" && activeThread && (
          <ThreadView
            thread={activeThread}
            onBack={() => setMobilePanel("threads")}
            initialUnreadCount={openedUnread}
          />
        )}
      </div>
    </DndProvider>
  );
}
