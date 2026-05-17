import {
    Table,
    Button,
    Heading,
    HStack,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Badge,
} from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { disciplinesService } from "../services/disciplines";
import { membersService } from "../services/members";
import type { DisciplineDTO, MemberDTO } from "@alentapp/shared";
import { Field } from "../components/ui/field";
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from "../components/ui/select";

export function DisciplinesView() {
    const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedMemberId, setSelectedMemberId] = useState<string>("");

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
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Stack>
    );
}
