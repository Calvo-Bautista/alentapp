import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Badge,
    Input,
    Checkbox,
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { disciplinesService } from "../services/disciplines";
import { membersService } from "../services/members";
import type {
    DisciplineDTO,
    MemberDTO,
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
} from "@alentapp/shared";
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from "../components/ui/select";

type FormData = {
    member_id: string;
    reason: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
};

const emptyForm: FormData = {
    member_id: "",
    reason: "",
    start_date: "",
    end_date: "",
    is_total_suspension: false,
};

export function DisciplinesView() {
    const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedMemberId, setSelectedMemberId] = useState<string>("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(emptyForm);

    const fetchMembers = async () => {
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (err: any) {
            console.error("Error cargando socios:", err.message);
        }
    };

    const fetchDisciplines = async (memberId: string) => {
        if (!memberId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await disciplinesService.getByMember(memberId);
            setDisciplines(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar las sanciones");
        } finally {
            setIsLoading(false);
        }
    };

    const getMemberName = (memberId: string): string => {
        const member = members.find((m) => m.id === memberId);
        return member ? member.name : memberId;
    };

    const openCreateModal = () => {
        setEditingDisciplineId(null);
        // Pre-carga el socio del filtro si hay uno seleccionado
        setFormData({ ...emptyForm, member_id: selectedMemberId || "" });
        setIsDialogOpen(true);
    };

    const openEditModal = (d: DisciplineDTO) => {
        setEditingDisciplineId(d.id);
        setFormData({
            member_id: d.member_id,
            reason: d.reason,
            start_date: d.start_date,
            end_date: d.end_date,
            is_total_suspension: d.is_total_suspension,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingDisciplineId) {
                const payload: UpdateDisciplineRequest = {
                    member_id: formData.member_id,
                    reason: formData.reason,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    is_total_suspension: formData.is_total_suspension,
                };
                await disciplinesService.update(editingDisciplineId, payload);
            } else {
                const payload: CreateDisciplineRequest = {
                    member_id: formData.member_id,
                    reason: formData.reason,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    is_total_suspension: formData.is_total_suspension,
                };
                await disciplinesService.create(payload);
            }
            setIsDialogOpen(false);
            // Refresca la tabla si el socio cargado coincide con el filtro
            if (selectedMemberId) fetchDisciplines(selectedMemberId);
        } catch (err: any) {
            alert(err.message || "Error al guardar la sanción");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        if (selectedMemberId) {
            fetchDisciplines(selectedMemberId);
        } else {
            setDisciplines([]);
        }
    }, [selectedMemberId]);

    const membersCollection = createListCollection({
        items: members.map((m) => ({ label: m.name, value: m.id })),
    });

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Administración de Sanciones</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Gestiona las sanciones disciplinarias aplicadas a los socios del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button
                            variant="outline"
                            onClick={() => selectedMemberId && fetchDisciplines(selectedMemberId)}
                            disabled={isLoading || !selectedMemberId}
                        >
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                            <LuPlus /> Agregar Sanción
                        </Button>
                    </HStack>
                </Flex>

                <Box>
                    <Field label="Filtrar por socio">
                        <SelectRoot
                            collection={membersCollection}
                            value={selectedMemberId ? [selectedMemberId] : []}
                            onValueChange={(e) => setSelectedMemberId(e.value[0] || "")}
                        >
                            <SelectTrigger>
                                <SelectValueText placeholder="Seleccione un socio para ver sus sanciones" />
                            </SelectTrigger>
                            <SelectContent>
                                {membersCollection.items.map((item) => (
                                    <SelectItem item={item} key={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Field>
                </Box>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingDisciplineId ? "Editar Sanción" : "Agregar Nueva Sanción"}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Socio" required>
                                    <SelectRoot
                                        collection={membersCollection}
                                        value={formData.member_id ? [formData.member_id] : []}
                                        onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] || "" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione un socio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {membersCollection.items.map((item) => (
                                                <SelectItem item={item} key={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>

                                <Field label="Motivo" required>
                                    <Input
                                        placeholder="Ej. Conducta antideportiva"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                    />
                                </Field>

                                <Field label="Fecha de inicio" required>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </Field>

                                <Field label="Fecha de fin" required>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </Field>

                                <Field label="Tipo de sanción">
                                    <Checkbox.Root
                                        checked={formData.is_total_suspension}
                                        onCheckedChange={(details) =>
                                            setFormData({ ...formData, is_total_suspension: !!details.checked })
                                        }
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Label>Suspensión total (impide ingreso al club)</Checkbox.Label>
                                    </Checkbox.Root>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                {editingDisciplineId ? "Guardar Cambios" : "Crear Sanción"}
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>

                {error && (
                    <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{error}</Text>
                    </Box>
                )}

                <Box
                    bg="bg.panel"
                    borderRadius="xl"
                    boxShadow="sm"
                    borderWidth="1px"
                    overflow="hidden"
                    minH="300px"
                    position="relative"
                >
                    {!selectedMemberId ? (
                        <Center h="300px">
                            <Text color="fg.muted">Seleccioná un socio para ver sus sanciones.</Text>
                        </Center>
                    ) : isLoading ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Spinner size="xl" color="blue.500" />
                                <Text color="fg.muted">Cargando sanciones...</Text>
                            </Stack>
                        </Center>
                    ) : disciplines.length === 0 ? (
                        <Center h="300px">
                            <Text color="fg.muted">Este socio no tiene sanciones registradas.</Text>
                        </Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Motivo</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Inicio</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Fin</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Tipo</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {disciplines.map((d) => (
                                    <Table.Row key={d.id} _hover={{ bg: "bg.muted/30" }}>
                                        <Table.Cell fontWeight="semibold" color="fg.emphasized">
                                            {getMemberName(d.member_id)}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">{d.reason}</Table.Cell>
                                        <Table.Cell color="fg.muted">{d.start_date}</Table.Cell>
                                        <Table.Cell color="fg.muted">{d.end_date}</Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorPalette={d.is_total_suspension ? "red" : "orange"}
                                                variant="solid"
                                            >
                                                {d.is_total_suspension ? "Total" : "Parcial"}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <HStack gap="2" justify="flex-end">
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Editar sanción"
                                                    onClick={() => openEditModal(d)}
                                                >
                                                    <LuPencil />
                                                </IconButton>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>
            </Stack>
        </DialogRoot>
    );
}
