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
import { useEffect, useMemo, useState } from "react";
import { lockersService } from "../services/lockers";
import { membersService } from "../services/members";
import type { LockerDTO, LockerStatus, MemberDTO } from "@alentapp/shared";

const statusLabel: Record<LockerStatus, string> = {
  Available: "Disponible",
  Occupied: "Ocupado",
  Maintenance: "En mantenimiento",
};

const statusColor: Record<LockerStatus, string> = {
  Available: "green",
  Occupied: "blue",
  Maintenance: "orange",
};

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.name));
    return map;
  }, [members]);

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [lockersData, membersData] = await Promise.all([
        lockersService.getAll(),
        membersService.getAll(),
      ]);
      setLockers(lockersData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar los casilleros");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="center">
        <Stack gap="1">
          <Heading size="2xl" fontWeight="bold">Administración de Casilleros</Heading>
          <Text color="fg.muted" fontSize="md">
            Gestiona los casilleros del club, su estado y los socios asignados.
          </Text>
        </Stack>
        <HStack gap="3">
          <Button variant="outline" onClick={fetchAll} disabled={isLoading}>
            <LuRefreshCw /> Actualizar
          </Button>
        </HStack>
      </Flex>

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
        {isLoading ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Spinner size="xl" color="blue.500" />
              <Text color="fg.muted">Cargando casilleros...</Text>
            </Stack>
          </Center>
        ) : lockers.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron casilleros.</Text>
              <Button variant="ghost" onClick={fetchAll}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {lockers.map((locker) => (
                <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    #{locker.number}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={statusColor[locker.status]} variant="solid">
                      {statusLabel[locker.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {locker.member_id ? memberNameById.get(locker.member_id) ?? "—" : "—"}
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
