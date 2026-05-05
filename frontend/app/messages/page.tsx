'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Package, Send, UserCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { disconnectChatSocket, getChatSocket, type LiveChatMessage } from '@/lib/chatSocket';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from '@/lib/utils';
import { isSellerAccount } from '@/lib/authMode';

type SenderType = 'BUYER' | 'SELLER';

interface Conversation {
    productId: string;
    counterpartyId: string;
    counterparty: {
        id: string;
        name: string;
        email: string;
    };
    product: {
        id: string;
        title: string;
        imageUrl: string;
    };
    lastMessage: {
        id: string;
        content: string;
        createdAt: string;
        senderType: SenderType;
        isRead: boolean;
    };
    unreadCount: number;
}

interface ThreadMessage {
    id: string;
    content: string;
    senderType: SenderType;
    buyerId: string;
    sellerId: string;
    isRead: boolean;
    createdAt: string;
}

interface ThreadResponse {
    product: {
        id: string;
        title: string;
        imageUrl: string;
        sellerId: string;
    };
    buyerId: string;
    sellerId: string;
    otherUserId: string;
    messages: ThreadMessage[];
}

const conversationKey = (conversation: Conversation) => `${conversation.productId}:${conversation.counterpartyId}`;

export default function MessagesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [thread, setThread] = useState<ThreadMessage[]>([]);
    const [draft, setDraft] = useState('');

    const messageListRef = useRef<HTMLDivElement>(null);
    const selectedConversationRef = useRef<Conversation | null>(null);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversationKey(conversation) === selectedKey) ?? null,
        [conversations, selectedKey]
    );

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const canReplyAsSeller = isSellerAccount(user);

    useEffect(() => {
        if (!isAuthenticated) {
            disconnectChatSocket();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        const fetchConversations = async () => {
            try {
                const response = await api.get<Conversation[]>('/messages/conversations');
                const items = Array.isArray(response.data) ? response.data : [];
                setConversations(items);
                setSelectedKey((prev) => {
                    if (items.length === 0) {
                        return null;
                    }

                    if (prev && items.some((item) => conversationKey(item) === prev)) {
                        return prev;
                    }

                    return conversationKey(items[0]);
                });
            } catch (err: any) {
                setError(err.response?.data?.error || 'Unable to load messages right now.');
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConversations();
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!selectedConversation) {
            setThread([]);
            return;
        }

        const fetchThread = async () => {
            setLoadingThread(true);
            setError('');
            try {
                const response = await api.get<ThreadResponse>(
                    `/messages/conversations/${selectedConversation.productId}/${selectedConversation.counterpartyId}`
                );
                setThread(response.data.messages ?? []);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Unable to load this conversation.');
            } finally {
                setLoadingThread(false);
            }
        };

        fetchThread();
    }, [selectedConversation]);

    useEffect(() => {
        if (!messageListRef.current) {
            return;
        }

        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }, [thread]);

    const refreshConversations = async () => {
        const response = await api.get<Conversation[]>('/messages/conversations');
        const items = Array.isArray(response.data) ? response.data : [];
        setConversations(items);
        setSelectedKey((prev) => {
            if (items.length === 0) {
                return null;
            }

            if (prev && items.some((item) => conversationKey(item) === prev)) {
                return prev;
            }

            return conversationKey(items[0]);
        });
    };

    useEffect(() => {
        if (!isAuthenticated || !user) {
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        const token = localStorage.getItem('reusemart_token');
        if (!token) {
            return;
        }

        const socket = getChatSocket(token);

        const handleLiveMessage = (incoming: LiveChatMessage) => {
            if (incoming.buyerId !== user.id && incoming.sellerId !== user.id) {
                return;
            }

            void refreshConversations();

            const activeConversation = selectedConversationRef.current;
            if (!activeConversation) {
                return;
            }

            const sameProduct = activeConversation.productId === incoming.productId;
            const sameCounterparty =
                (incoming.buyerId === user.id && incoming.sellerId === activeConversation.counterpartyId) ||
                (incoming.sellerId === user.id && incoming.buyerId === activeConversation.counterpartyId);

            if (!sameProduct || !sameCounterparty) {
                return;
            }

            api.get<ThreadResponse>(`/messages/conversations/${activeConversation.productId}/${activeConversation.counterpartyId}`)
                .then((response) => setThread(response.data.messages ?? []))
                .catch(() => {});
        };

        socket.on('chat:new-message', handleLiveMessage);

        return () => {
            socket.off('chat:new-message', handleLiveMessage);
        };
    }, [isAuthenticated, user?.id]);

    const isMine = (message: ThreadMessage) => {
        if (!user) {
            return false;
        }

        if (message.senderType === 'BUYER') {
            return message.buyerId === user.id;
        }

        return message.sellerId === user.id;
    };

    const handleSend = async (event: FormEvent) => {
        event.preventDefault();

        const text = draft.trim();
        if (!text || !selectedConversation || !user) {
            return;
        }

        setSending(true);
        setError('');

        try {
            const response = await api.post('/messages/reply', {
                content: text,
                productId: selectedConversation.productId,
                otherUserId: selectedConversation.counterpartyId,
            });

            const created = response.data;
            setThread((prev) => [
                ...prev,
                {
                    id: created.id,
                    content: created.content,
                    senderType: created.senderType,
                    buyerId: created.buyerId,
                    sellerId: created.sellerId,
                    isRead: created.isRead,
                    createdAt: created.createdAt,
                },
            ]);
            setDraft('');
            await refreshConversations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send your message.');
        } finally {
            setSending(false);
        }
    };

    if (loadingConversations) {
        return (
            <div className="py-10">
                <div className="page-container max-w-6xl">
                    <div className="skeleton h-8 w-52 mb-6" />
                    <div className="grid lg:grid-cols-[320px,1fr] gap-4">
                        <div className="skeleton h-[420px]" />
                        <div className="skeleton h-[420px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-10">
            <div className="page-container max-w-6xl">
                <div className="mb-6">
                    <h1 className="section-title">Messages</h1>
                    <p className="section-sub">
                        {canReplyAsSeller
                            ? 'Chat with buyers and sellers from one shared inbox.'
                            : 'Chat with sellers about your products and orders.'}
                    </p>
                </div>

                {error && (
                    <div
                        className="mb-4 rounded-lg px-3 py-2 text-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#B91C1C' }}
                    >
                        {error}
                    </div>
                )}

                {conversations.length === 0 ? (
                    <div className="card p-16 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No conversations yet</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Start by opening a product and sending a message.
                        </p>
                        <div className="mt-4">
                            <Link href="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
                                Browse Products
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[320px,1fr] gap-4">
                        <aside className="card overflow-hidden">
                            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Conversations</p>
                            </div>
                            <div className="max-h-[640px] overflow-y-auto">
                                {conversations.map((conversation) => {
                                    const active = conversationKey(conversation) === selectedKey;
                                    return (
                                        <button
                                            key={conversationKey(conversation)}
                                            onClick={() => setSelectedKey(conversationKey(conversation))}
                                            className="w-full text-left px-4 py-3 border-b"
                                            style={{
                                                borderColor: 'var(--border-color)',
                                                background: active ? 'rgba(40, 116, 240, 0.08)' : 'transparent',
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                            {conversation.counterparty.name}
                                                        </p>
                                                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                            {formatDistanceToNow(conversation.lastMessage.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        <Package className="w-3 h-3" />
                                                        <span className="truncate">{conversation.product.title}</span>
                                                    </div>
                                                    <p className="text-xs truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        {conversation.lastMessage.content}
                                                    </p>
                                                </div>
                                                {conversation.unreadCount > 0 && (
                                                    <span
                                                        className="text-[10px] text-white px-1.5 py-0.5 rounded-full"
                                                        style={{ background: 'var(--accent-primary)' }}
                                                    >
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="card flex flex-col min-h-[520px]">
                            {selectedConversation ? (
                                <>
                                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {selectedConversation.counterparty.name}
                                                </p>
                                                <Link
                                                    href={`/products/${selectedConversation.productId}`}
                                                    className="text-xs"
                                                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                                                >
                                                    About: {selectedConversation.product.title}
                                                </Link>
                                            </div>
                                            <UserCircle2 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>

                                    <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: 'var(--bg-hover)' }}>
                                        {loadingThread ? (
                                            <div className="space-y-3">
                                                <div className="skeleton h-12 w-3/5" />
                                                <div className="skeleton h-12 w-2/5 ml-auto" />
                                            </div>
                                        ) : thread.length === 0 ? (
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                No messages in this conversation yet.
                                            </p>
                                        ) : (
                                            thread.map((message) => {
                                                const mine = isMine(message);
                                                return (
                                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                        <div
                                                            className="max-w-[78%] rounded-lg px-3 py-2"
                                                            style={{
                                                                background: mine ? 'var(--accent-primary)' : '#FFFFFF',
                                                                color: mine ? '#FFFFFF' : 'var(--text-primary)',
                                                                border: mine ? 'none' : '1px solid var(--border-color)',
                                                            }}
                                                        >
                                                            <p className="text-sm leading-relaxed" style={{ margin: 0 }}>{message.content}</p>
                                                            <p
                                                                className="text-[11px] mt-1"
                                                                style={{ color: mine ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
                                                            >
                                                                {formatDistanceToNow(message.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <form onSubmit={handleSend} className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex gap-2">
                                            <input
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                className="input-field"
                                                placeholder="Type your message..."
                                                maxLength={1000}
                                            />
                                            <button type="submit" className="btn-primary" disabled={sending || !draft.trim()}>
                                                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a conversation to start chatting.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
